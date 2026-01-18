import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function TeamDetail() {
  const { id } = useParams()
  const { teams, players } = useApp()
  const [games, setGames] = useState([])
  const [stats, setStats] = useState({ wins: 0, losses: 0, pf: 0, pa: 0 })

  const team = teams.find(t => t.id === parseInt(id))
  const roster = players
    .filter(p => p.team_id === parseInt(id))
    .sort((a, b) => {
      if (a.is_captain && !b.is_captain) return -1
      if (!a.is_captain && b.is_captain) return 1
      return (a.jersey_number || 99) - (b.jersey_number || 99)
    })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('games')
        .select('*')
        .or(`home_team_id.eq.${id},away_team_id.eq.${id}`)
        .order('week')

      if (data) {
        setGames(data)

        let wins = 0, losses = 0, pf = 0, pa = 0
        data.filter(g => g.is_complete && g.game_type === 'regular').forEach(g => {
          const isHome = g.home_team_id === parseInt(id)
          const teamScore = isHome ? g.home_score : g.away_score
          const oppScore = isHome ? g.away_score : g.home_score

          pf += teamScore
          pa += oppScore
          if (teamScore > oppScore) wins++
          else losses++
        })

        setStats({ wins, losses, pf, pa })
      }
    }
    load()
  }, [id])

  if (!team) {
    return (
      <div className="p-4">
        <div className="card text-center py-8 text-gray-500">Team not found</div>
      </div>
    )
  }

  const gamesPlayed = stats.wins + stats.losses
  const ppg = gamesPlayed > 0 ? (stats.pf / gamesPlayed).toFixed(1) : '0.0'
  const diff = stats.pf - stats.pa

  return (
    <div className="p-4">
      <Link to="/teams" className="text-sm text-primary-500 dark:text-primary-400 mb-4 inline-block">
        ← All Teams
      </Link>

      {/* Team Header */}
      <div className="card mb-4">
        <div className="flex items-center gap-4">
          <div className="avatar-xl shrink-0" style={{ backgroundColor: team.color }}>
            {team.short_name}
          </div>
          <div>
            <h1 className="text-xl font-bold dark:text-white">{team.name}</h1>
            {team.motto && (
              <p className="text-gray-500 dark:text-gray-400 italic text-sm">"{team.motto}"</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.wins}</div>
            <div className="text-xs text-gray-500">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">{stats.losses}</div>
            <div className="text-xs text-gray-500">Losses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">{ppg}</div>
            <div className="text-xs text-gray-500">PPG</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
              {diff > 0 ? '+' : ''}{diff}
            </div>
            <div className="text-xs text-gray-500">+/-</div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Roster</h2>
      {roster.length === 0 ? (
        <div className="card text-center py-6 text-gray-500 dark:text-gray-400">
          No players added yet
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {roster.map(player => (
            <div key={player.id} className="card flex items-center gap-3 py-3">
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="avatar" style={{ backgroundColor: team.color }}>
                  {player.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium dark:text-white truncate">
                  {player.name}
                  {player.is_captain && <span className="ml-1 text-primary-500">©</span>}
                </div>
                <div className="text-xs text-gray-500">
                  {player.jersey_number && `#${player.jersey_number}`}
                  {player.position && ` • ${player.position}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule */}
      <h2 className="text-lg font-semibold mb-3 dark:text-white">Schedule</h2>
      <div className="space-y-2">
        {games.slice(0, 8).map(game => {
          const isHome = game.home_team_id === parseInt(id)
          const opponent = isHome ? game.away_team : game.home_team
          const teamScore = isHome ? game.home_score : game.away_score
          const oppScore = isHome ? game.away_score : game.home_score
          const won = game.is_complete && teamScore > oppScore

          return (
            <div
              key={game.id}
              className={`card py-3 flex items-center justify-between
                ${game.is_complete && won ? 'border-l-4 border-l-green-500' : ''}
                ${game.is_complete && !won ? 'border-l-4 border-l-red-500' : ''}`}
            >
              <div>
                <div className="text-sm dark:text-white">
                  {isHome ? 'vs' : '@'} {opponent}
                </div>
                <div className="text-xs text-gray-500">
                  Week {game.week} • {game.game_time}
                </div>
              </div>

              {game.is_complete ? (
                <div className={`font-bold ${won ? 'text-green-600' : 'text-red-500'}`}>
                  {won ? 'W' : 'L'} {teamScore}-{oppScore}
                </div>
              ) : (
                <span className="text-xs text-gray-400">Upcoming</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
