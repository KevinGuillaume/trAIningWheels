import type { Point2D } from './pca'

export interface PlotLayout {
  width: number
  height: number
  padding: number
  scaleX: (x: number) => number
  scaleY: (y: number) => number
}

/**
 * Fits a pixel layout from a fixed set of points (the corpus). Both Embedding
 * and Retrieval must plot against the SAME layout instance — fitting bounds
 * independently per stage means the same chunk lands at a different pixel
 * position in each one, even though its underlying PCA coordinate is identical.
 */
export function createPlotLayout(points: Point2D[], width: number, height: number, padding: number): PlotLayout {
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1

  return {
    width,
    height,
    padding,
    scaleX: (x) => padding + ((x - minX) / spanX) * (width - 2 * padding),
    scaleY: (y) => height - padding - ((y - minY) / spanY) * (height - 2 * padding),
  }
}
