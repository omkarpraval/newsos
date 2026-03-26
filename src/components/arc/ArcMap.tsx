import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import type { ArcAnalysis } from '../../types'

type PlayerNode = ArcAnalysis['players'][number] & { id: string; r: number }

export function ArcMap({ players }: { players: ArcAnalysis['players'] }) {
  const ref = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (!ref.current || !players.length) return
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    const width = ref.current.clientWidth || 600
    const height = 280

    const nodes: PlayerNode[] = players.map((p) => ({
      ...p,
      id: p.name,
      r: 12 + p.influence * 1.2,
    }))

    const simulation = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collision',
        d3.forceCollide<d3.SimulationNodeDatum>().radius((d) => (d as unknown as PlayerNode).r + 4)
      )

    const g = svg.append('g')

    const node = g
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', '#1e1e1e')
      .attr('stroke', '#f0a500')
      .attr('stroke-width', 1.2)

    const label = g
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d) => d.name)
      .attr('font-size', 10)
      .attr('fill', '#f0ede8')
      .attr('text-anchor', 'middle')

    simulation.on('tick', () => {
      node.each(function (d) {
        const dd = d as d3.SimulationNodeDatum & { r: number }
        dd.x = Math.max(dd.r, Math.min(width - dd.r, dd.x ?? 0))
        dd.y = Math.max(dd.r, Math.min(height - dd.r, dd.y ?? 0))
      })
      node.attr('cx', (d) => (d as d3.SimulationNodeDatum).x ?? 0).attr('cy', (d) => (d as d3.SimulationNodeDatum).y ?? 0)
      label
        .attr('x', (d) => (d as d3.SimulationNodeDatum).x ?? 0)
        .attr('y', (d) => ((d as d3.SimulationNodeDatum).y ?? 0) + 4)
    })

    return () => {
      simulation.stop()
    }
  }, [players])

  return (
    <svg ref={ref} className="h-72 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]" aria-label="Players map" />
  )
}
