'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { POST_IMAGE_NATURAL } from '../data/postImageDimensions'
import {
  BACKGROUND_READY_ATTR,
  BACKGROUND_READY_EVENT,
} from '../lib/background-ready'
import {
  SOCIAL_LINKS_BACKGROUND_RESUME,
  consumePendingBfcacheResume,
  shouldResumeBackgroundNavigation,
} from '../lib/background-resume'

const imageUrls = [
  '/posts/post-01.webp', '/posts/post-02.webp', '/posts/post-03.webp', '/posts/post-04.webp',
  '/posts/post-05.webp', '/posts/post-06.webp', '/posts/post-07.webp', '/posts/post-08.webp',
  '/posts/post-09.webp', '/posts/post-10.webp', '/posts/post-11.webp', '/posts/post-12.webp',
  '/posts/post-13.webp', '/posts/post-14.webp', '/posts/post-15.webp', '/posts/post-16.webp',
  '/posts/post-17.webp', '/posts/post-18.webp', '/posts/post-19.webp', '/posts/post-20.webp',
  '/posts/post-21.webp', '/posts/post-22.webp', '/posts/post-23.webp', '/posts/post-24.webp',
  '/posts/post-25.webp', '/posts/post-26.webp', '/posts/post-27.webp', '/posts/post-28.webp',
]

const MAX_IMAGES = 24
const INITIAL_ON_SCREEN = Math.min(12, imageUrls.length)
/** Images that must decode before the UI reveals (separate from spawn count). */
const MIN_VISIBLE_AT_LOAD = 6
/** Viewport-height bands for initial spread (not progress lanes). */
const INITIAL_VIEWPORT_BANDS = 5
/** Upward drift duration (seconds) — higher = slower float. */
const UPWARD_DRIFT_DURATION_BASE = 55
const UPWARD_DRIFT_DURATION_DEPTH_SPAN = 66
const UPWARD_DRIFT_DURATION_MIN = 16
const SPAWN_COLLISION_PADDING = 10
/** Extra separation for initial on-screen batch (visible cards overlap more noticeably). */
const INITIAL_COLLISION_PADDING = 28
/** Typical roll (deg) when width/roll are not known yet (spawn planning). */
const TYPICAL_ROLL_ESTIMATE_DEG = 10
/** Desktop refill interval; mobile ticks more often but spawns fewer per tick. */
const REFILL_TICK_MS_DESKTOP = 520
const REFILL_TICK_MS_NARROW = 380
const REFILL_SPAWN_MAX_PER_TICK_NARROW = 1
const REFILL_SPAWN_MAX_PER_TICK_DESKTOP = 3
const REFILL_SPAWN_MAX_TOPUP_NARROW = 2

interface FloatingImage {
  id: string
  src: string
  x: number
  y: number
  width: number
  height: number
  naturalWidth: number
  naturalHeight: number
  depth: number
  roll: number
  progress0: number
}

function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRollMagnitude(): number {
  return 5 + Math.random() * 8
}

/** Screen-side signal from card position (outer edge weighted for wide cards). */
function getImageSideNorm(
  x: number,
  width: number,
  ww: number
): { centerNorm: number; sideStrength: number } {
  const wwHalf = Math.max(1, ww / 2)
  const centerX = x + width / 2
  const centerNormRaw = (centerX - ww / 2) / wwHalf
  const halfWidthNorm = (width / 2) / wwHalf
  // Bias toward the edge nearer the screen rim so wide cards read as left/right correctly.
  const outerEdgeNorm =
    centerNormRaw >= 0
      ? centerNormRaw + halfWidthNorm * 0.45
      : centerNormRaw - halfWidthNorm * 0.45
  const centerNorm = Math.max(-1, Math.min(1, outerEdgeNorm))
  const sideStrength = Math.pow(Math.abs(centerNorm), 0.55)
  return { centerNorm, sideStrength }
}

function pickRollDirection(
  ww: number,
  x: number,
  width: number,
  displayHeight: number,
  progress0: number,
  existingImages: FloatingImage[],
  wh: number
): 1 | -1 {
  const { centerNorm, sideStrength } = getImageSideNorm(x, width, ww)

  // Left: negative roll; right: positive. Stronger toward edges, looser near center.
  const sideSign =
    centerNorm === 0 ? (Math.random() < 0.5 ? 1 : -1) : Math.sign(centerNorm)
  const sideClockwiseBase = 0.5 + sideSign * sideStrength * 0.49

  const clockwiseCount = existingImages.filter((img) => img.roll > 0).length
  const counterClockwiseCount = existingImages.length - clockwiseCount
  const total = clockwiseCount + counterClockwiseCount
  const balanceClockwise = total > 0 ? 0.5 + (counterClockwiseCount - clockwiseCount) / (total * 4.5) : 0.5

  const centerX = x + width / 2
  const bandHalfWidth = Math.max(80, width * 0.75)
  const spawnCenterY =
    getSpawnTopY(wh, displayHeight, progress0, width, TYPICAL_ROLL_ESTIMATE_DEG) +
    displayHeight / 2
  let nearestAbove: FloatingImage | null = null
  let nearestScore = Infinity
  for (const img of existingImages) {
    const imgCenterX = img.x + img.width / 2
    const xDelta = Math.abs(imgCenterX - centerX)
    if (xDelta > bandHalfWidth) continue
    const imgCenterY = getImageViewportCenterY(img, wh)
    if (imgCenterY >= spawnCenterY - 16) continue
    const yDelta = spawnCenterY - imgCenterY
    const score = yDelta + xDelta * 0.9
    if (score < nearestScore) {
      nearestScore = score
      nearestAbove = img
    }
  }

  const alternateClockwise =
    nearestAbove == null
      ? 0.5
      : nearestAbove.roll > 0
        ? 0.2
        : 0.8

  const sideWeight = 0.68 + sideStrength * 0.32
  const alternateWeight = (1 - sideStrength) * 0.1
  const balanceWeight = (1 - sideStrength) * 0.04
  const blendTotal = sideWeight + alternateWeight + balanceWeight
  const clockwiseProbability = Math.max(
    0.03,
    Math.min(
      0.97,
      (sideClockwiseBase * sideWeight +
        alternateClockwise * alternateWeight +
        balanceClockwise * balanceWeight) /
        blendTotal
    )
  )
  return Math.random() < clockwiseProbability ? 1 : -1
}

function pickUniqueDepth(existingImages: FloatingImage[]): number {
  const minDepth = 0.12
  const maxDepth = 1
  const minSeparation = 0.012
  const existingDepths = existingImages.map((img) => img.depth)

  for (let i = 0; i < 80; i++) {
    const candidate = minDepth + Math.random() * (maxDepth - minDepth)
    const tooClose = existingDepths.some((d) => Math.abs(d - candidate) < minSeparation)
    if (!tooClose) return candidate
  }

  // Fallback: pick the largest gap midpoint to guarantee separation.
  const sorted = [...existingDepths, minDepth, maxDepth].sort((a, b) => a - b)
  let bestMid = 0.56
  let bestGap = -1
  for (let i = 0; i < sorted.length - 1; i++) {
    const gap = sorted[i + 1] - sorted[i]
    if (gap > bestGap) {
      bestGap = gap
      bestMid = sorted[i] + gap / 2
    }
  }
  return Math.max(minDepth, Math.min(maxDepth, bestMid))
}

function getDisplayWidthBounds(ww: number): { min: number; max: number } {
  const narrow = ww < 768
  const min = narrow ? 76 : 150
  const max = narrow
    ? Math.max(min + 20, Math.min(148, Math.floor(ww * 0.42)))
    : 350
  return { min, max }
}

function getTargetDensity(ww: number): number {
  if (ww < 420) return 11
  if (ww < 768) return 14
  if (ww < 1200) return 13
  return 16
}

function getRotatedAabbSize(width: number, height: number, rollDeg: number): { width: number; height: number } {
  const radians = Math.abs(rollDeg) * (Math.PI / 180)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return {
    width: Math.abs(width * cos) + Math.abs(height * sin),
    height: Math.abs(width * sin) + Math.abs(height * cos),
  }
}

/**
 * Baseline `top` for floaters (below the fold before translateY).
 * A fixed floor of 1200px matched tall desktops but on short phone viewports it was
 * far below `wh`, so motion only occupied the lower half of the screen during load.
 */
function getSpawnBaseY(wh: number, displayHeight: number): number {
  const legacy = Math.max(1200, wh + displayHeight)
  const proportional = wh + displayHeight + Math.max(96, Math.round(wh * 0.2))
  if (legacy > wh * 1.38) return proportional
  return legacy
}

/** Total upward travel (progress 0 → 1): spawn below the fold, exit above the top edge. */
function getFloatLift(
  wh: number,
  displayHeight: number,
  displayWidth: number,
  rollDeg: number
): number {
  const baseY = getSpawnBaseY(wh, displayHeight)
  const aabb = getRotatedAabbSize(displayWidth, displayHeight, rollDeg)
  const exitClearance = Math.max(96, wh * 0.14) + aabb.height
  return baseY + exitClearance
}

/** Max spawn progress so the card is still fully below the viewport (refill entry only). */
function getMaxBelowFoldProgress0(
  wh: number,
  displayHeight: number,
  displayWidth: number,
  rollDeg: number
): number {
  const baseY = getSpawnBaseY(wh, displayHeight)
  const lift = getFloatLift(wh, displayHeight, displayWidth, rollDeg)
  if (lift <= 0) return 0
  const aabb = getRotatedAabbSize(displayWidth, displayHeight, rollDeg)
  const belowFoldTop = wh + Math.max(24, wh * 0.03)
  const maxP = (baseY - (belowFoldTop + aabb.height * 0.08)) / lift
  return Math.max(0, Math.min(0.14, maxP))
}

function getOffscreenRefillProgressRange(wh: number, ww: number): { minP: number; maxP: number } {
  const { min, max } = getDisplayWidthBounds(ww)
  const width = Math.round((min + max) / 2)
  const height = getTypicalDisplayHeight(ww)
  const maxP = getMaxBelowFoldProgress0(wh, height, width, TYPICAL_ROLL_ESTIMATE_DEG)
  return { minP: 0, maxP: Math.max(0.01, maxP * 0.92) }
}

function getSpawnTopY(
  wh: number,
  height: number,
  progress0: number,
  width?: number,
  rollDeg = TYPICAL_ROLL_ESTIMATE_DEG
): number {
  const w = width ?? Math.round(height * 0.72)
  const baseY = getSpawnBaseY(wh, height)
  const lift = getFloatLift(wh, height, w, rollDeg)
  return baseY - lift * progress0
}

function getFloatingImageTopY(img: FloatingImage, wh: number): number {
  const lift = getFloatLift(wh, img.height, img.width, img.roll)
  return img.y - lift * img.progress0
}

function isVisibleAtLoad(img: FloatingImage, wh: number): boolean {
  const top = getFloatingImageTopY(img, wh)
  const aabb = getRotatedAabbSize(img.width, img.height, img.roll)
  const bottom = top + aabb.height
  return bottom > wh * 0.04 && top < wh * 0.94
}

function countVisibleAtLoad(images: FloatingImage[], wh: number): number {
  return images.filter((img) => isVisibleAtLoad(img, wh)).length
}

function getTypicalDisplayHeight(ww: number): number {
  const { min, max } = getDisplayWidthBounds(ww)
  const width = Math.round((min + max) * 0.5)
  return Math.round(width * 0.72)
}

function getVisibleProgressRange(
  wh: number,
  height: number,
  width?: number
): { minP: number; maxP: number } {
  const w = width ?? Math.round(height * 0.72)
  const baseY = getSpawnBaseY(wh, height)
  const lift = getFloatLift(wh, height, w, TYPICAL_ROLL_ESTIMATE_DEG)
  const minTop = wh * 0.04
  const maxTop = wh * 0.92
  const maxP = (baseY - minTop) / lift
  const minP = (baseY - maxTop) / lift
  return {
    minP: Math.max(0.04, Math.min(minP, maxP)),
    maxP: Math.min(0.94, Math.max(minP, maxP)),
  }
}

function progressForViewportCenterY(
  wh: number,
  height: number,
  targetCenterY: number,
  width?: number
): number {
  const w = width ?? Math.round(height * 0.72)
  const baseY = getSpawnBaseY(wh, height)
  const lift = getFloatLift(wh, height, w, TYPICAL_ROLL_ESTIMATE_DEG)
  return (baseY + height * 0.5 - targetCenterY) / lift
}

function getViewportBandCenterY(wh: number, bandIndex: number, bandCount: number): number {
  const margin = wh * 0.08
  const usable = Math.max(1, wh - margin * 2)
  return margin + usable * ((bandIndex + 0.5) / bandCount)
}

function getImageViewportCenterY(img: FloatingImage, wh: number): number {
  const top = getFloatingImageTopY(img, wh)
  const aabb = getRotatedAabbSize(img.width, img.height, img.roll)
  return top + aabb.height / 2
}

function getViewportBandIndex(centerY: number, wh: number, bandCount: number): number {
  const t = Math.max(0, Math.min(1, centerY / Math.max(1, wh)))
  return Math.max(0, Math.min(bandCount - 1, Math.floor(t * bandCount)))
}

function countViewportBandOccupancy(
  images: FloatingImage[],
  wh: number,
  bandCount: number
): number[] {
  const counts = Array.from({ length: bandCount }, () => 0)
  for (const img of images) {
    const band = getViewportBandIndex(getImageViewportCenterY(img, wh), wh, bandCount)
    counts[band]++
  }
  return counts
}

function pickWeightedInitialViewportBand(bandCount: number): number {
  const weights = Array.from({ length: bandCount }, (_, i) => {
    const t = i / Math.max(1, bandCount - 1)
    return 0.55 + t * 0.85
  })
  const total = weights.reduce((sum, w) => sum + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < bandCount; i++) {
    roll -= weights[i]
    if (roll <= 0) return i
  }
  return bandCount - 1
}

function pickUnderfilledViewportBand(
  wh: number,
  existingImages: FloatingImage[],
  bandCount: number
): number {
  const counts = countViewportBandOccupancy(existingImages, wh, bandCount)
  const minCount = Math.min(...counts)
  let bestBand = 0
  let bestScore = -Infinity

  for (let band = 0; band < bandCount; band++) {
    const underfill = (minCount + 1) / (counts[band] + 1)
    const bottomWeight = 0.7 + (band / Math.max(1, bandCount - 1)) * 0.65
    const score = underfill * bottomWeight
    if (score > bestScore) {
      bestScore = score
      bestBand = band
    }
  }

  return bestBand
}

function getPlacementCenter(
  x: number,
  width: number,
  height: number,
  roll: number,
  progress0: number,
  wh: number
): { x: number; y: number } {
  const aabb = getRotatedAabbSize(width, height, roll)
  const top = getSpawnTopY(wh, height, progress0, width, roll)
  return { x: x + width / 2, y: top + aabb.height / 2 }
}

function hasImageCollision(
  img: FloatingImage,
  others: FloatingImage[],
  wh: number,
  padding = SPAWN_COLLISION_PADDING
): boolean {
  const aabb = getRotatedAabbSize(img.width, img.height, img.roll)
  const center = getPlacementCenter(img.x, img.width, img.height, img.roll, img.progress0, wh)
  const halfW = aabb.width / 2
  const halfH = aabb.height / 2

  for (const other of others) {
    if (other.id === img.id) continue
    const otherAabb = getRotatedAabbSize(other.width, other.height, other.roll)
    const otherCenter = getPlacementCenter(
      other.x,
      other.width,
      other.height,
      other.roll,
      other.progress0,
      wh
    )
    const overlapX =
      Math.abs(center.x - otherCenter.x) < halfW + otherAabb.width / 2 + padding
    const overlapY =
      Math.abs(center.y - otherCenter.y) < halfH + otherAabb.height / 2 + padding
    if (overlapX && overlapY) return true
  }
  return false
}

/** Place into a viewport band only if it does not overlap existing images. */
function tryPlaceImageInViewportBand(
  img: FloatingImage,
  wh: number,
  ww: number,
  bandIndex: number,
  bandCount: number,
  existing: FloatingImage[]
): boolean {
  const others = existing.filter((other) => other.id !== img.id)
  const centerY = getViewportBandCenterY(wh, bandIndex, bandCount)
  const { minP, maxP } = getVisibleProgressRange(wh, img.height, img.width)
  const targetP = progressForViewportCenterY(wh, img.height, centerY, img.width)

  for (let attempt = 0; attempt < 16; attempt++) {
    const jitter = (Math.random() - 0.5) * (0.03 + attempt * 0.018)
    img.progress0 = Math.min(maxP, Math.max(minP, targetP + jitter))
    nudgeImageOffCenter(img, ww, existing)
    if (!hasImageCollision(img, others, wh, INITIAL_COLLISION_PADDING)) return true
  }
  return false
}

function getCenterAvoidHalfWidth(ww: number): number {
  return Math.min(ww * 0.32, 240)
}

function overlapsCenterContentBand(ww: number, centerX: number, halfWidth: number): boolean {
  const screenCenter = ww / 2
  const avoid = getCenterAvoidHalfWidth(ww)
  const left = centerX - halfWidth
  const right = centerX + halfWidth
  return left < screenCenter + avoid && right > screenCenter - avoid
}

function nudgeImageOffCenter(img: FloatingImage, ww: number, existingImages: FloatingImage[]): void {
  const halfWidth = getRotatedAabbSize(img.width, img.height, img.roll).width / 2
  const centerX = img.x + img.width / 2
  if (!overlapsCenterContentBand(ww, centerX, halfWidth)) return

  const others = existingImages.filter((other) => other.id !== img.id)
  img.x = pickSpreadX(ww, img.width, img.height, others, true, img.roll)
}

/** Last-resort nudge for any remaining initial overlaps after band placement. */
function resolveInitialOverlaps(images: FloatingImage[], wh: number, ww: number): void {
  const padding = INITIAL_COLLISION_PADDING
  for (let pass = 0; pass < 48; pass++) {
    let resolved = false
    for (let i = 0; i < images.length; i++) {
      for (let j = i + 1; j < images.length; j++) {
        const a = images[i]
        const b = images[j]
        if (!hasImageCollision(b, [a], wh, padding)) continue
        const mover = images[j]
        const others = images.filter((img) => img.id !== mover.id)
        const savedP = mover.progress0
        const savedX = mover.x
        const { minP } = getVisibleProgressRange(wh, mover.height, mover.width)
        mover.progress0 = Math.max(minP, mover.progress0 - 0.05 - pass * 0.008)
        nudgeImageOffCenter(mover, ww, images)
        if (!hasImageCollision(mover, others, wh, padding)) {
          resolved = true
          continue
        }
        mover.progress0 = savedP
        mover.x = Math.min(ww - mover.width - 8, savedX + 20 + pass * 4)
        nudgeImageOffCenter(mover, ww, images)
        if (!hasImageCollision(mover, others, wh, padding)) {
          resolved = true
          continue
        }
        mover.progress0 = savedP
        mover.x = savedX
      }
    }
    if (!resolved) break
  }
}

/** Spread images across viewport-height bands (progress only — never moves X). */
function fillEmptyInitialViewportBands(images: FloatingImage[], wh: number, ww: number): void {
  const bandCount = INITIAL_VIEWPORT_BANDS
  let counts = countViewportBandOccupancy(images, wh, bandCount)

  for (let band = bandCount - 1; band >= 0; band--) {
    while (counts[band] === 0 && images.length > 0) {
      let donorIndex = -1
      let donorCount = -1
      for (let i = 0; i < images.length; i++) {
        const donorBand = getViewportBandIndex(getImageViewportCenterY(images[i], wh), wh, bandCount)
        if (counts[donorBand] > donorCount) {
          donorCount = counts[donorBand]
          donorIndex = i
        }
      }
      if (donorIndex < 0 || donorCount < 2) break
      const donor = images[donorIndex]
      if (!tryPlaceImageInViewportBand(donor, wh, ww, band, bandCount, images)) {
        break
      }
      counts = countViewportBandOccupancy(images, wh, bandCount)
    }
  }
}

/** Raise progress on edge-placed images so enough are in view — without spawning in the center. */
function nudgeInitialVisibility(images: FloatingImage[], wh: number): void {
  let visible = countVisibleAtLoad(images, wh)
  if (visible >= MIN_VISIBLE_AT_LOAD) return

  const sorted = [...images].sort((a, b) => a.progress0 - b.progress0)
  for (const img of sorted) {
    if (visible >= MIN_VISIBLE_AT_LOAD) break
    if (isVisibleAtLoad(img, wh)) continue
    const { maxP } = getVisibleProgressRange(wh, img.height, img.width)
    const others = images.filter((other) => other.id !== img.id)
    const savedP = img.progress0
    const nextP = Math.min(maxP, img.progress0 + 0.12)
    img.progress0 = nextP
    if (hasImageCollision(img, others, wh, INITIAL_COLLISION_PADDING)) {
      img.progress0 = savedP
      continue
    }
    if (isVisibleAtLoad(img, wh)) visible++
  }
}

function hasSpawnCollision(
  candidate: { x: number; width: number; height: number; roll: number; progress0: number },
  existingImages: FloatingImage[],
  wh: number,
  padding = SPAWN_COLLISION_PADDING
): boolean {
  const candidateAabb = getRotatedAabbSize(candidate.width, candidate.height, candidate.roll)
  const center = getPlacementCenter(
    candidate.x,
    candidate.width,
    candidate.height,
    candidate.roll,
    candidate.progress0,
    wh
  )
  const cHalfW = candidateAabb.width / 2
  const cHalfH = candidateAabb.height / 2

  for (const img of existingImages) {
    const imgAabb = getRotatedAabbSize(img.width, img.height, img.roll)
    const imgCenter = getPlacementCenter(
      img.x,
      img.width,
      img.height,
      img.roll,
      img.progress0,
      wh
    )
    const overlapX =
      Math.abs(center.x - imgCenter.x) < cHalfW + imgAabb.width / 2 + padding
    const overlapY =
      Math.abs(center.y - imgCenter.y) < cHalfH + imgAabb.height / 2 + padding
    if (overlapX && overlapY) return true
  }
  return false
}

function pickSpreadX(
  ww: number,
  displayWidth: number,
  displayHeight: number,
  existingImages: FloatingImage[],
  avoidCenterBand: boolean,
  rollDeg: number
): number {
  const spawnAabb = getRotatedAabbSize(displayWidth, displayHeight, rollDeg)
  const spawnHalfWidth = spawnAabb.width / 2
  const minCenter = 8 + spawnHalfWidth
  const maxCenter = Math.max(minCenter, ww - 8 - spawnHalfWidth)
  const minX = minCenter - displayWidth / 2
  const maxX = maxCenter - displayWidth / 2
  if (maxCenter <= minCenter || existingImages.length === 0) {
    const center = minCenter + Math.random() * (maxCenter - minCenter)
    return center - displayWidth / 2
  }

  const laneCount = 6
  const laneWidth = Math.max(1, ww / laneCount)
  const laneCounts = Array.from({ length: laneCount }, () => 0)
  const existingCenters = existingImages.map((img) => {
    const rotated = getRotatedAabbSize(img.width, img.height, img.roll)
    return {
      center: img.x + img.width / 2,
      halfWidth: rotated.width / 2,
    }
  })
  for (const { center } of existingCenters) {
    const lane = Math.max(0, Math.min(laneCount - 1, Math.floor(center / laneWidth)))
    laneCounts[lane]++
  }
  const centerLane = (laneCount - 1) / 2

  // Build a set of candidate positions across the full width and pick the one
  // with the largest minimum distance from existing image centers.
  const candidateCount = Math.max(12, Math.min(28, existingImages.length * 2))
  const step = (maxX - minX) / Math.max(1, candidateCount - 1)

  const center = ww / 2
  const centerAvoidHalfWidth = getCenterAvoidHalfWidth(ww)

  let bestX = minX
  let bestScore = -Infinity

  for (let i = 0; i < candidateCount; i++) {
    const baseCenter = minCenter + step * i
    // slight jitter avoids perfectly rigid lanes while keeping spread
    const jitter = (Math.random() - 0.5) * Math.max(6, step * 0.35)
    const candidateCenter = Math.min(maxCenter, Math.max(minCenter, baseCenter + jitter))
    const candidateX = candidateCenter - displayWidth / 2

    let nearestGap = Infinity
    for (const { center, halfWidth } of existingCenters) {
      const gap = Math.abs(center - candidateCenter) - (halfWidth + spawnHalfWidth)
      if (gap < nearestGap) nearestGap = gap
    }

    // Prefer under-filled lanes, but bias those lanes toward screen edges.
    const lane = Math.max(0, Math.min(laneCount - 1, Math.floor(candidateCenter / laneWidth)))
    const laneEdgeDistance = Math.abs(lane - centerLane)
    const laneEdgePreference = 1 + laneEdgeDistance * 0.45
    const laneBias = laneEdgePreference / (laneCounts[lane] + 1)

    // Prefer edge spawns over center while still prioritizing spread.
    const edgeDistance = Math.min(candidateCenter - minCenter, maxCenter - candidateCenter)
    const maxEdgeDistance = (maxCenter - minCenter) / 2
    const edgeBias = Math.max(0, maxEdgeDistance - edgeDistance)
    let score = nearestGap + edgeBias * 0.42 + laneBias * 95

    if (avoidCenterBand) {
      const bandLeft = center - centerAvoidHalfWidth
      const bandRight = center + centerAvoidHalfWidth
      const spawnLeft = candidateCenter - spawnHalfWidth
      const spawnRight = candidateCenter + spawnHalfWidth
      const overlapsCenterBand = spawnLeft < bandRight && spawnRight > bandLeft
      if (overlapsCenterBand) {
        // Strong penalty to make initial-load placements unlikely behind content.
        const overlapAmount = Math.min(spawnRight, bandRight) - Math.max(spawnLeft, bandLeft)
        score -= Math.max(0, overlapAmount) * 3.2
      }
    }

    if (score > bestScore) {
      bestScore = score
      bestX = candidateX
    }
  }

  return bestX
}

function pickSpreadProgress(
  existingImages: FloatingImage[],
  range: { minP: number; maxP: number } = { minP: 0.04, maxP: 0.66 }
): number {
  const { minP, maxP } = range
  if (existingImages.length === 0) return minP + Math.random() * (maxP - minP)

  const laneCount = 6
  const laneWidth = (maxP - minP) / laneCount
  const laneCounts = Array.from({ length: laneCount }, () => 0)
  const existingProgress = existingImages.map((img) => img.progress0)

  for (const p of existingProgress) {
    const lane = Math.max(0, Math.min(laneCount - 1, Math.floor((p - minP) / laneWidth)))
    laneCounts[lane]++
  }
  const minLaneCount = Math.min(...laneCounts)

  const candidateCount = 16
  let bestP = minP
  let bestScore = -Infinity

  for (let i = 0; i < candidateCount; i++) {
    const t = i / Math.max(1, candidateCount - 1)
    const baseP = minP + (maxP - minP) * t
    const jitter = (Math.random() - 0.5) * 0.06
    const candidateP = Math.min(maxP, Math.max(minP, baseP + jitter))

    let nearest = Infinity
    for (const p of existingProgress) {
      const dist = Math.abs(p - candidateP)
      if (dist < nearest) nearest = dist
    }

    const lane = Math.max(0, Math.min(laneCount - 1, Math.floor((candidateP - minP) / laneWidth)))
    const laneBias = (minLaneCount + 1) / (laneCounts[lane] + 1)
    const score = nearest + laneBias * 0.15

    if (score > bestScore) {
      bestScore = score
      bestP = candidateP
    }
  }

  return bestP
}

function buildFloatingImage(
  src: string,
  ww: number,
  wh: number,
  used: Set<string>,
  progress0: number,
  existingImages: FloatingImage[],
  avoidCenterBand = false,
  entryMode: 'initial' | 'refill' = 'refill'
): FloatingImage | null {
  if (used.has(src)) return null
  const meta = POST_IMAGE_NATURAL[src]
  if (!meta) return null

  const naturalW = meta.w
  const naturalH = meta.h
  if (naturalW < 1 || naturalH < 1) return null

  const { min: minDisplayW, max: maxDisplayW } = getDisplayWidthBounds(ww)

  for (let attempt = 0; attempt < 40; attempt++) {
    const displayWidth = Math.round(Math.random() * (maxDisplayW - minDisplayW) + minDisplayW)
    const displayHeight = Math.round((displayWidth / naturalW) * naturalH)
    // First pick a provisional roll for spawn-bound calculations.
    const provisionalRoll = (Math.random() < 0.5 ? -1 : 1) * pickRollMagnitude()
    const x = pickSpreadX(ww, displayWidth, displayHeight, existingImages, avoidCenterBand, provisionalRoll)
    const y = getSpawnBaseY(wh, displayHeight)
    const rollMagnitude = pickRollMagnitude()
    const rollDirection = pickRollDirection(
      ww,
      x,
      displayWidth,
      displayHeight,
      progress0,
      existingImages,
      wh
    )
    const roll = rollDirection * rollMagnitude
    const finalP0 =
      entryMode === 'refill'
        ? Math.min(progress0, getMaxBelowFoldProgress0(wh, displayHeight, displayWidth, roll))
        : progress0

    const collisionPadding =
      entryMode === 'initial' ? INITIAL_COLLISION_PADDING : SPAWN_COLLISION_PADDING
    if (
      hasSpawnCollision(
        { x, width: displayWidth, height: displayHeight, roll, progress0: finalP0 },
        existingImages,
        wh,
        collisionPadding
      )
    ) {
      continue
    }

    const depth = pickUniqueDepth(existingImages)
    return {
      id: generateUniqueId(),
      src,
      x,
      y,
      width: displayWidth,
      height: displayHeight,
      naturalWidth: naturalW,
      naturalHeight: naturalH,
      depth,
      roll,
      progress0: finalP0,
    }
  }

  return null
}

/** Prefer a post that is not already on-screen; try every unused src (shuffled) before giving up. */
function trySpawnUnusedImage(
  ww: number,
  wh: number,
  used: Set<string>,
  progress0: number,
  existingImages: FloatingImage[],
  avoidCenterBand: boolean,
  entryMode: 'initial' | 'refill' = 'refill'
): boolean {
  const unused = imageUrls.filter((u) => !used.has(u))
  if (unused.length === 0) return false
  for (const src of shuffle(unused)) {
    const img = buildFloatingImage(
      src,
      ww,
      wh,
      used,
      progress0,
      existingImages,
      avoidCenterBand,
      entryMode
    )
    if (img) {
      used.add(src)
      existingImages.push(img)
      return true
    }
  }
  return false
}

function spawnRefillImages(
  ww: number,
  wh: number,
  next: FloatingImage[],
  used: Set<string>,
  targetCount: number,
  maxSpawn: number,
  avoidCenterBand: boolean
): void {
  let spawned = 0
  let guard = 0
  while (next.length < targetCount && spawned < maxSpawn && guard < 80) {
    guard++
    const progress0 = pickSpreadProgress(next, getOffscreenRefillProgressRange(wh, ww))
    if (!trySpawnUnusedImage(ww, wh, used, progress0, next, avoidCenterBand, 'refill')) break
    spawned++
  }
}

function buildInitialBatch(ww: number, wh: number): FloatingImage[] {
  const used = new Set<string>()
  const targetCount =
    ww < 420 ? 8 : ww < 768 ? Math.min(9, INITIAL_ON_SCREEN) : INITIAL_ON_SCREEN
  const out: FloatingImage[] = []
  let guard = 0
  const maxGuard = 320

  while (out.length < targetCount && guard < maxGuard) {
    guard++
    const bandCount = INITIAL_VIEWPORT_BANDS
    const targetBand =
      out.length === 0
        ? pickWeightedInitialViewportBand(bandCount)
        : pickUnderfilledViewportBand(wh, out, bandCount)
    const approxHeight = getTypicalDisplayHeight(ww)
    const centerY = getViewportBandCenterY(wh, targetBand, bandCount)
    const { minP, maxP } = getVisibleProgressRange(wh, approxHeight)
    const jitter = (Math.random() - 0.5) * 0.04
    const p0 = Math.min(
      maxP,
      Math.max(minP, progressForViewportCenterY(wh, approxHeight, centerY) + jitter)
    )

    if (!trySpawnUnusedImage(ww, wh, used, p0, out, true, 'initial')) continue

    const img = out[out.length - 1]
    if (!tryPlaceImageInViewportBand(img, wh, ww, targetBand, bandCount, out)) {
      out.pop()
      used.delete(img.src)
      continue
    }
  }

  fillEmptyInitialViewportBands(out, wh, ww)
  nudgeInitialVisibility(out, wh)
  resolveInitialOverlaps(out, wh, ww)
  return out
}

let initialBackgroundSnapshot: { h: number; images: FloatingImage[] } | null = null

/**
 * Must return the SAME value on SSR and the first client render to avoid a
 * hydration mismatch (which previously caused the whole `<motion.div>` tree to
 * be regenerated and end up blank with no animation). We populate the snapshot
 * synchronously after mount via `useLayoutEffect`, before paint.
 */
function getInitialBackgroundSnapshot(): { h: number; images: FloatingImage[] } {
  return { h: 0, images: [] }
}

export default function FloatingImages() {
  const [images, setImages] = useState<FloatingImage[]>(() => getInitialBackgroundSnapshot().images)
  const [windowHeight, setWindowHeight] = useState(() => getInitialBackgroundSnapshot().h)
  const [isRevealReady, setIsRevealReady] = useState(false)
  /** Bumped on bfcache restore so floaters remount and replay `initial` → `animate` like a fresh load. */
  const [sceneKey, setSceneKey] = useState(0)
  const [narrowViewport, setNarrowViewport] = useState(false)
  const imagesRef = useRef<FloatingImage[]>([])
  const initialImageIdsRef = useRef<Set<string>>(new Set())
  const loadedInitialImageIdsRef = useRef<Set<string>>(new Set())

  // Seed the moment images first appear (we now start empty on both SSR and client).
  if (typeof window !== 'undefined' && initialImageIdsRef.current.size === 0 && images.length > 0) {
    initialImageIdsRef.current = new Set(images.map((img) => img.id))
  }
  const revealReadySentRef = useRef(false)
  const lastVisibleCountRef = useRef(images.length)
  const resumeGenerationRef = useRef(0)

  const markRevealReady = useCallback(() => {
    if (revealReadySentRef.current) return
    revealReadySentRef.current = true
    setIsRevealReady(true)
    document.documentElement.setAttribute(BACKGROUND_READY_ATTR, '1')
    window.dispatchEvent(new Event(BACKGROUND_READY_EVENT))
  }, [])

  const resumeFromBFCache = useCallback(() => {
    resumeGenerationRef.current += 1
    const seq = resumeGenerationRef.current
    let applied = false
    const apply = (): boolean => {
      if (seq !== resumeGenerationRef.current) return true
      if (applied) return true
      const ww = window.innerWidth
      const wh = window.innerHeight
      // After BFCache restore, Chrome can briefly report 0×0 until layout settles; a no-op
      // here used to leave the layer invisible forever (opacity gated on isRevealReady).
      if (ww < 1 || wh < 1) return false
      applied = true

      const next = buildInitialBatch(ww, wh)
      initialImageIdsRef.current = new Set(next.map((img) => img.id))
      loadedInitialImageIdsRef.current.clear()
      initialBackgroundSnapshot = { h: wh, images: next }

      revealReadySentRef.current = true
      setWindowHeight(wh)
      setImages(next)
      setIsRevealReady(true)
      setSceneKey((k) => k + 1)

      try {
        document.documentElement.setAttribute(BACKGROUND_READY_ATTR, '1')
        window.dispatchEvent(new Event(BACKGROUND_READY_EVENT))
      } catch {
        /* noop */
      }
      return true
    }

    if (apply()) return

    let frames = 0
    const tick = () => {
      frames++
      if (apply()) return
      if (frames < 96) {
        requestAnimationFrame(tick)
        return
      }
      window.setTimeout(() => {
        apply()
      }, 50)
      window.setTimeout(() => {
        apply()
      }, 220)
    }
    requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    const onResumeSignal = () => {
      requestAnimationFrame(() => resumeFromBFCache())
    }
    window.addEventListener(SOCIAL_LINKS_BACKGROUND_RESUME, onResumeSignal)
    return () => window.removeEventListener(SOCIAL_LINKS_BACKGROUND_RESUME, onResumeSignal)
  }, [resumeFromBFCache])

  /** Dynamic chunk often loads after `pageshow`; Root may have set sessionStorage for BFCache. */
  useEffect(() => {
    if (consumePendingBfcacheResume() || shouldResumeBackgroundNavigation()) {
      requestAnimationFrame(() => resumeFromBFCache())
    }
  }, [resumeFromBFCache])

  useEffect(() => {
    imagesRef.current = images
    // Keep a live snapshot so remounts can restore current density.
    initialBackgroundSnapshot = { h: windowHeight, images }
  }, [images, windowHeight])

  useEffect(() => {
    if (windowHeight > 0) {
      initialBackgroundSnapshot = { h: windowHeight, images: imagesRef.current }
    }
  }, [windowHeight])

  useEffect(() => {
    if (isRevealReady) return
    const fallback = window.setTimeout(() => {
      markRevealReady()
    }, 2200)
    return () => window.clearTimeout(fallback)
  }, [isRevealReady, markRevealReady])

  /** Resize + one-time fill if the viewport was 0 on first init. */
  useLayoutEffect(() => {
    const measure = () => {
      const ww = window.innerWidth
      const wh = window.innerHeight
      setNarrowViewport(ww < 768)
      setWindowHeight(wh)

      setImages((prev) => {
        if (prev.length === 0 || ww < 1 || wh < 1) return prev

        const { max: maxDisplayW } = getDisplayWidthBounds(ww)

        return prev.map((img) => {
          const maxAllowedW = Math.max(40, Math.min(maxDisplayW, ww - 16))
          const nextW = Math.min(img.width, maxAllowedW)
          const nextH = Math.round((nextW / img.naturalWidth) * img.naturalHeight)
          const maxX = Math.max(8, ww - nextW - 8)

          return {
            ...img,
            width: nextW,
            height: nextH,
            x: Math.min(maxX, Math.max(8, img.x)),
            y: getSpawnBaseY(wh, nextH),
          }
        })
      })
    }
    measure()

    setImages((prev) => {
      if (prev.length > 0) return prev
      const w = window.innerWidth
      const h = window.innerHeight
      if (w < 1 || h < 1) return prev
      return buildInitialBatch(w, h)
    })

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const refillDensity = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

    const ww = window.innerWidth
    const wh = window.innerHeight
    if (ww < 1 || wh < 1) return

    setImages((prev) => {
      const target = Math.min(MAX_IMAGES, getTargetDensity(ww))
      if (prev.length >= target) return prev

      const used = new Set(prev.map((p) => p.src))
      const next = [...prev]
      const maxSpawn =
        ww < 768 ? REFILL_SPAWN_MAX_PER_TICK_NARROW : REFILL_SPAWN_MAX_PER_TICK_DESKTOP
      spawnRefillImages(ww, wh, next, used, target, maxSpawn, false)
      return next
    })
  }, [])

  const topUpTo = useCallback((targetCount: number) => {
    const ww = window.innerWidth
    const wh = window.innerHeight
    if (ww < 1 || wh < 1) return

    setImages((prev) => {
      if (prev.length >= targetCount) return prev
      const used = new Set(prev.map((p) => p.src))
      const next = [...prev]
      const maxSpawn = ww < 768 ? REFILL_SPAWN_MAX_TOPUP_NARROW : targetCount
      spawnRefillImages(ww, wh, next, used, targetCount, maxSpawn, true)
      return next
    })
  }, [])

  useEffect(() => {
    if (!isRevealReady) return

    let intervalId: ReturnType<typeof setInterval> | undefined

    const startSpawning = () => {
      if (intervalId != null) return
      refillDensity()
      intervalId = setInterval(
        refillDensity,
        narrowViewport ? REFILL_TICK_MS_NARROW : REFILL_TICK_MS_DESKTOP
      )
    }

    const stopSpawning = () => {
      if (intervalId != null) {
        clearInterval(intervalId)
        intervalId = undefined
      }
    }

    const onVisibility = () => {
      if (typeof document === 'undefined') return
      if (document.visibilityState === 'visible') {
        // Restore density level seen before tab was hidden.
        topUpTo(Math.min(MAX_IMAGES, lastVisibleCountRef.current))
        startSpawning()
      } else {
        lastVisibleCountRef.current = imagesRef.current.length
        stopSpawning()
      }
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      topUpTo(Math.min(MAX_IMAGES, lastVisibleCountRef.current))
      startSpawning()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopSpawning()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [isRevealReady, narrowViewport, refillDensity, topUpTo])

  const handleImageComplete = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id))
  }

  const handleInitialImageReady = useCallback(
    (id: string) => {
      if (isRevealReady) return
      if (!initialImageIdsRef.current.has(id)) return
      loadedInitialImageIdsRef.current.add(id)
      const target = Math.min(
        MIN_VISIBLE_AT_LOAD,
        Math.max(1, initialImageIdsRef.current.size)
      )
      if (loadedInitialImageIdsRef.current.size >= target) {
        markRevealReady()
      }
    },
    [isRevealReady, markRevealReady]
  )

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className={
          narrowViewport
            ? 'absolute inset-0 z-0 bg-gradient-to-b from-sky-100/[0.3] via-transparent to-amber-900/[0.055]'
            : 'absolute inset-0 z-0 bg-gradient-to-b from-sky-100/[0.22] via-transparent to-amber-950/[0.12]'
        }
        aria-hidden
      />
      <div
        className={
          narrowViewport
            ? 'absolute inset-0 z-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,rgba(255,255,255,0.52),transparent_55%)]'
            : 'absolute inset-0 z-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-5%,rgba(255,255,255,0.45),transparent_55%)]'
        }
        aria-hidden
      />

      <div
        className="absolute inset-0 z-[1] [perspective:2000px] [perspective-origin:50%_42%]"
        style={{
          opacity: isRevealReady ? 1 : 0,
          visibility: isRevealReady ? 'visible' : 'hidden',
          filter: isRevealReady ? 'blur(0px)' : 'blur(12px)',
          transform: isRevealReady ? 'scale(1)' : 'scale(0.985)',
          transition:
            'opacity 420ms cubic-bezier(0.22, 1, 0.36, 1), filter 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'opacity, filter, transform',
        }}
      >
        <div key={sceneKey} className="absolute inset-0 [transform-style:preserve-3d]">
          {(() => {
            const sortedByDepth = [...images].sort((a, b) => {
              if (a.depth === b.depth) return a.id.localeCompare(b.id)
              return a.depth - b.depth
            })
            const byId = new Map<string, number>()
            sortedByDepth.forEach((img, idx) => {
              byId.set(img.id, 8 + idx)
            })
            const priorityIds = new Set(
              sortedByDepth.slice(-4).map((img) => img.id)
            )
            const eagerLoadIds = new Set(
              sortedByDepth.slice(-10).map((img) => img.id)
            )
            return images.map((image) => {
              const zLayer = byId.get(image.id) ?? 8
              const d = image.depth
              const blurPx = (1 - d) * 5.5
              const brightnessLift = narrowViewport ? 0.07 : 0
              const brightness = brightnessLift + 0.78 + d * 0.26
              const saturate = 0.88 + d * 0.16
              const vw = typeof window !== 'undefined' ? window.innerWidth : 1
              const centerNormRaw = ((image.x + image.width / 2) - vw / 2) / Math.max(1, vw / 2)
              const centerNorm = Math.max(-1, Math.min(1, centerNormRaw))
              const edgeFactor = Math.abs(centerNorm)
              const edgeCurve = Math.pow(edgeFactor, 1.05)
              // Left-side images yaw right; right-side images yaw left (toward center).
              const centerTiltY = -Math.sign(centerNorm) * edgeCurve * 30
              const centerTiltZMultiplier = 0.88 + edgeCurve * 0.82
              const vhForLift =
                windowHeight > 0
                  ? windowHeight
                  : typeof window !== 'undefined'
                    ? window.innerHeight
                    : 1
              const lift = getFloatLift(vhForLift, image.height, image.width, image.roll)
              const p0 = image.progress0
              const baseDuration = UPWARD_DRIFT_DURATION_BASE + (1 - d) * UPWARD_DRIFT_DURATION_DEPTH_SPAN
              const duration = Math.max(UPWARD_DRIFT_DURATION_MIN, baseDuration * (1 - p0))
              const shadowY = 10 + d * 36
              const shadowBlur = 18 + d * 52
              const shadowAlpha = narrowViewport ? 0.08 + d * 0.22 : 0.12 + d * 0.32
              const rim = 0.06 + d * 0.14
              const scaleA = 0.68 + d * 0.42
              const scaleB = 0.74 + d * 0.38
              const rotXA = (1 - d) * 18
              const rotXB = (1 - d) * 7
              const zA = -380 + d * 430
              const zB = -310 + d * 390

              return (
                <motion.div
                  key={image.id}
                  initial={{
                    y: -lift * p0,
                    scale: scaleA + (scaleB - scaleA) * p0,
                    z: zA + (zB - zA) * p0,
                    rotateX: rotXA + (rotXB - rotXA) * p0,
                    rotateY: centerTiltY * 1.22,
                    rotateZ: image.roll * centerTiltZMultiplier * 1.02,
                  }}
                  animate={{
                    y: -lift,
                    scale: scaleB,
                    z: zB,
                    rotateX: rotXB,
                    rotateY: centerTiltY,
                    rotateZ: image.roll * centerTiltZMultiplier * 0.94,
                  }}
                  transition={{
                    duration,
                    ease: 'linear',
                  }}
                  onAnimationComplete={() => handleImageComplete(image.id)}
                  style={{
                    position: 'absolute',
                    left: `${image.x}px`,
                    top: `${image.y}px`,
                    width: image.width,
                    height: image.height,
                    transformStyle: 'preserve-3d',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    willChange: 'transform',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    zIndex: zLayer,
                  }}
                  className="pointer-events-none select-none"
                >
                  <div
                    className={
                      narrowViewport
                        ? 'flex h-full w-full items-center justify-center bg-neutral-900/[0.07]'
                        : 'flex h-full w-full items-center justify-center bg-neutral-900/15'
                    }
                    style={{
                      transformStyle: 'preserve-3d',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: `
                        0 ${shadowY}px ${shadowBlur}px -12px rgba(0,0,0,${shadowAlpha}),
                        0 ${4 + d * 10}px ${12 + d * 20}px rgba(0,0,0,${0.06 + d * 0.1}),
                        inset 0 1px 0 rgba(255,255,255,${rim}),
                        inset 0 -1px 0 rgba(0,0,0,${0.04 + (1 - d) * 0.06})
                      `,
                      filter: `blur(${blurPx}px) brightness(${brightness}) saturate(${saturate})`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      willChange: 'transform',
                      transformOrigin: '50% 50%',
                    }}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={image.naturalWidth}
                      height={image.naturalHeight}
                      sizes={`${Math.round(image.width)}px`}
                      className="h-full w-full object-contain"
                      draggable={false}
                      priority={priorityIds.has(image.id)}
                      loading={eagerLoadIds.has(image.id) ? 'eager' : 'lazy'}
                      onLoad={() => handleInitialImageReady(image.id)}
                      onError={() => handleInitialImageReady(image.id)}
                    />
                  </div>
                </motion.div>
              )
            })
          })()}
        </div>
      </div>

      <div
        className={
          narrowViewport
            ? 'absolute inset-0 z-[2] shadow-[inset_0_0_80px_rgba(0,0,0,0.07),inset_0_-60px_100px_rgba(0,0,0,0.1)]'
            : 'absolute inset-0 z-[2] shadow-[inset_0_0_100px_rgba(0,0,0,0.14),inset_0_-80px_140px_rgba(0,0,0,0.18)]'
        }
        aria-hidden
      />
      <div
        className={
          narrowViewport
            ? 'absolute inset-0 z-[3] bg-gradient-to-t from-black/[0.045] via-transparent to-white/[0.055]'
            : 'absolute inset-0 z-[3] bg-gradient-to-t from-black/[0.08] via-transparent to-white/[0.04]'
        }
        aria-hidden
      />
    </div>
  )
}
