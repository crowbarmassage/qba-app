import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function Standings() {
  const { teams } = useApp()
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState([]) // For H2H comparison
  const [h2h, setH2h] = useState(null)

  useEffect(() => {
    fetchStandings()

    const channel = supabase
      .channel('standings-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games'
      }, fetchStandings)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [teams])

  async function fetchStandings() {
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('is_complete', true)
      .eq('game_type', 'regular')

    // Calculate standings
    const stats = {}
    teams.forEach(t => {
      stats[t.id] = {
        ...t,
        wins: 0,
        losses: 0,
        pf: 0,
        pa: 0,
        streak: []
      }
    })

    const sorted = (games || []).sort((a, b) => a.week - b.week)

    sorted.forEach(g => {
      const home = stats[g.home_team_id]
      const away = stats[g.away_team_id]
      if (!home || !away) return

      home.pf += g.home_score
      home.pa += g.away_score
      away.pf += g.away_score
      away.pa += g.home_score

      if (g.home_score > g.away_score) {
        home.wins++
        away.losses++
        home.streak.push('W')
        away.streak.push('L')
      } else {
        away.wins++
        home.losses++
        away.streak.push('W')
        home.streak.push('L')
      }
    })

    // Calculate current streak
    Object.values(stats).forEach(t => {
      let count = 0, type = null
      for (let i = t.streak.length - 1; i >= 0; i--) {
        if (!type) { type = t.streak[i]; count = 1 }
        else if (t.streak[i] === type) count++
        else break
      }
      t.currentStreak = type ? `${type}${count}` : '-'
      t.diff = t.pf - t.pa
    })

    // Sort
    const ranked = Object.values(stats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.diff !== a.diff) return b.diff - a.diff
      return b.pf - a.pf
    })

    setStandings(ranked)
    setLoading(false)
  }

  // H2H selection
  function toggleSelect(teamId) {
    setSelected(prev => {
      if (prev.includes(teamId)) return prev.filter(id => id !== teamId)
      if (prev.length >= 2) return [prev[1], teamId]
      return [...prev, teamId]
    })
  }

  // Fetch H2H when 2 teams selected
  useEffect(() => {
    if (selected.length !== 2) {
      setH2h(null)
      return
    }

    const [t1, t2] = selected

    supabase
      .from('games')
      .select('*')
      .eq('is_complete', true)
      .or(`and(home_team_id.eq.${t1},away_team_id.eq.${t2}),and(home_team_id.eq.${t2},away_team_id.eq.${t1})`)
      .then(({ data }) => {
        if (!data) return

        let t1Wins = 0, t2Wins = 0, t1Pts = 0, t2Pts = 0
        data.forEach(g => {
          if (g.home_team_id === t1) {
            t1Pts += g.home_score
            t2Pts += g.away_score
            if (g.home_score > g.away_score) t1Wins++
            else t2Wins++
          } else {
            t2Pts += g.home_score
            t1Pts += g.away_score
            if (g.home_score > g.away_score) t2Wins++
            else t1Wins++
          }
        })

        setH2h({
          team1: standings.find(s => s.id === t1),
          team2: standings.find(s => s.id === t2),
          t1Wins, t2Wins, t1Pts, t2Pts,
          games: data.length
        })
      })
  }, [selected, standings])

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-8 w-40 mb-4" />
        <div className="skeleton h-64" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-1 dark:text-white">Standings</h2>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Tap two teams to compare head-to-head
      </p>

      {/* H2H Card */}
      {h2h && (
        <div className="card mb-4 animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm dark:text-white">Head-to-Head</h3>
            <button onClick={() => setSelected([])} className="text-xs text-gray-400 hover:text-gray-600">
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="avatar mx-auto mb-1" style={{ backgroundColor: h2h.team1?.color }}>
                {h2h.team1?.short_name}
              </div>
              <div className="text-2xl font-bold dark:text-white">{h2h.t1Wins}</div>
              <div className="text-xs text-gray-500">{h2h.t1Pts} pts</div>
            </div>
            <div className="px-4 text-gray-400">vs</div>
            <div className="text-center flex-1">
              <div className="avatar mx-auto mb-1" style={{ backgroundColor: h2h.team2?.color }}>
                {h2h.team2?.short_name}
              </div>
              <div className="text-2xl font-bold dark:text-white">{h2h.t2Wins}</div>
              <div className="text-xs text-gray-500">{h2h.t2Pts} pts</div>
            </div>
          </div>

          {h2h.games === 0 && (
            <p className="text-center text-sm text-gray-400 mt-3">Haven't played yet</p>
          )}
        </div>
      )}

      {/* Standings Table */}
      <div className="card overflow-hidden p-0">
        <table className="stats-table">
          <thead>
            <tr>
              <th className="w-8 pl-3">#</th>
              <th>Team</th>
              <th className="text-center w-10">W</th>
              <th className="text-center w-10 pr-3">L</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team, idx) => {
              const seed = idx + 1
              const isSelected = selected.includes(team.id)
              
              // Seed-based row color
              let rowBg = ''
              if (seed <= 2) rowBg = 'bg-green-50 dark:bg-green-900/10'
              else if (seed <= 4) rowBg = 'bg-blue-50 dark:bg-blue-900/10'
              else rowBg = 'bg-yellow-50 dark:bg-yellow-900/10'

              return (
                <tr
                  key={team.id}
                  onClick={() => toggleSelect(team.id)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                    ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : rowBg}`}
                >
                  <td className="pl-3 font-medium text-gray-400">{seed}</td>
                  <td>
                    <Link 
                      to={`/teams/${team.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2"
                    >
                      <div className="avatar-sm" style={{ backgroundColor: team.color }}>
                        {team.short_name?.charAt(0)}
                      </div>
                      <span className="font-medium dark:text-white">{team.name}</span>
                      {seed === 1 && <span>👑</span>}
                    </Link>
                  </td>
                  <td className="text-center font-semibold text-green-600 dark:text-green-400">
                    {team.wins}
                  </td>
                  <td className="text-center text-gray-500 pr-3">{team.losses}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 dark:bg-green-900/30" />
          Bye (1-2)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-900/30" />
          Home (3-4)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-900/30" />
          Play-in (5-6)
        </div>
      </div>
    </div>
  )
}
