import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function Recap() {
  const { teams, players } = useApp()
  const [games, setGames] = useState([])
  const [potwWinners, setPotwWinners] = useState([])
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [gamesRes, potwRes] = await Promise.all([
        supabase.from('games').select('*').eq('is_complete', true).order('week'),
        supabase.from('potw_winners').select('*, players(*)').order('week')
      ])

      if (gamesRes.data) setGames(gamesRes.data)
      if (potwRes.data) setPotwWinners(potwRes.data)
      setLoading(false)
    }
    load()
  }, [])

  // Calculate team stats
  function getTeamStats(teamId) {
    const teamGames = games.filter(g => 
      (g.home_team_id === teamId || g.away_team_id === teamId) && g.game_type === 'regular'
    )

    let wins = 0, losses = 0, pf = 0, pa = 0
    let biggestWin = null, winStreak = 0, currentStreak = 0

    teamGames.forEach(g => {
      const isHome = g.home_team_id === teamId
      const teamScore = isHome ? g.home_score : g.away_score
      const oppScore = isHome ? g.away_score : g.home_score
      const margin = teamScore - oppScore
      const won = margin > 0

      pf += teamScore
      pa += oppScore

      if (won) {
        wins++
        currentStreak++
        winStreak = Math.max(winStreak, currentStreak)
        if (!biggestWin || margin > biggestWin.margin) {
          biggestWin = { margin, teamScore, oppScore, opponent: isHome ? g.away_team : g.home_team }
        }
      } else {
        losses++
        currentStreak = 0
      }
    })

    return {
      wins, losses, pf, pa,
      ppg: teamGames.length > 0 ? (pf / teamGames.length).toFixed(1) : 0,
      biggestWin,
      winStreak,
      gamesPlayed: teamGames.length
    }
  }

  // League records
  function getLeagueRecords() {
    let highestScore = null, biggestBlowout = null, closestGame = null

    games.forEach(g => {
      const homeTeam = teams.find(t => t.id === g.home_team_id)
      const awayTeam = teams.find(t => t.id === g.away_team_id)
      const margin = Math.abs(g.home_score - g.away_score)

      // Highest single-game score
      if (!highestScore || g.home_score > highestScore.score) {
        highestScore = { team: homeTeam, score: g.home_score }
      }
      if (!highestScore || g.away_score > highestScore.score) {
        highestScore = { team: awayTeam, score: g.away_score }
      }

      // Biggest blowout
      if (!biggestBlowout || margin > biggestBlowout.margin) {
        biggestBlowout = {
          margin,
          winner: g.home_score > g.away_score ? homeTeam : awayTeam,
          game: g
        }
      }

      // Closest game
      if (!closestGame || margin < closestGame.margin) {
        closestGame = { margin, homeTeam, awayTeam, game: g }
      }
    })

    return { highestScore, biggestBlowout, closestGame }
  }

  // Share recap
  async function handleShare() {
    const team = teams.find(t => t.id === selectedTeam)
    const stats = getTeamStats(selectedTeam)

    const text = `🏀 MWBL Season Recap - ${team?.name}\n\n` +
      `Record: ${stats.wins}-${stats.losses}\n` +
      `PPG: ${stats.ppg}\n` +
      `Best Win Streak: ${stats.winStreak}\n\n` +
      `#MWBL #Basketball`

    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  const records = getLeagueRecords()
  const currentWeek = Math.max(...games.map(g => g.week), 1)

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-48" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Season Recap</h2>

      {/* Progress */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Season Progress</span>
          <span className="text-sm font-medium dark:text-white">Week {currentWeek} of 9</span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${(currentWeek / 9) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 mt-1">{games.length} games completed</div>
      </div>

      {/* League Records */}
      <div className="card mb-4">
        <h3 className="font-semibold mb-3 dark:text-white">🏆 League Records</h3>
        <div className="space-y-3 text-sm">
          {records.highestScore && (
            <div className="flex justify-between">
              <span className="text-gray-500">Highest Score</span>
              <span className="font-medium dark:text-white">
                {records.highestScore.score} pts ({records.highestScore.team?.short_name})
              </span>
            </div>
          )}
          {records.biggestBlowout && (
            <div className="flex justify-between">
              <span className="text-gray-500">Biggest Win</span>
              <span className="font-medium dark:text-white">
                +{records.biggestBlowout.margin} ({records.biggestBlowout.winner?.short_name})
              </span>
            </div>
          )}
          {records.closestGame && (
            <div className="flex justify-between">
              <span className="text-gray-500">Closest Game</span>
              <span className="font-medium dark:text-white">
                {records.closestGame.game.home_score}-{records.closestGame.game.away_score}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* POTW Winners */}
      {potwWinners.length > 0 && (
        <div className="card mb-4">
          <h3 className="font-semibold mb-3 dark:text-white">⭐ Players of the Week</h3>
          <div className="space-y-2">
            {potwWinners.map(w => {
              const team = teams.find(t => t.id === w.players?.team_id)
              return (
                <div key={w.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-sm font-medium">
                    {w.week}
                  </div>
                  <div className="avatar-sm" style={{ backgroundColor: team?.color }}>
                    {w.players?.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{w.players?.name}</div>
                    <div className="text-xs text-gray-500">{team?.name}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team Recap Selector */}
      <div className="mb-4">
        <h3 className="font-semibold mb-3 dark:text-white">📊 Team Recap</h3>
        <div className="flex flex-wrap gap-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(selectedTeam === team.id ? null : team.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors
                ${selectedTeam === team.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
              style={selectedTeam === team.id ? { backgroundColor: team.color } : {}}
            >
              {team.short_name}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Team Recap */}
      {selectedTeam && (() => {
        const team = teams.find(t => t.id === selectedTeam)
        const stats = getTeamStats(selectedTeam)
        const diff = stats.pf - stats.pa

        return (
          <div className="card animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="avatar-lg" style={{ backgroundColor: team.color }}>
                {team.short_name}
              </div>
              <div>
                <h4 className="font-bold dark:text-white">{team.name}</h4>
                <p className="text-sm text-gray-500">Season Stats</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold dark:text-white">{stats.wins}-{stats.losses}</div>
                <div className="text-xs text-gray-500">Record</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold dark:text-white">{stats.ppg}</div>
                <div className="text-xs text-gray-500">PPG</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className={`text-2xl font-bold ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {diff > 0 ? '+' : ''}{diff}
                </div>
                <div className="text-xs text-gray-500">Point Diff</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="text-2xl font-bold dark:text-white">{stats.winStreak}</div>
                <div className="text-xs text-gray-500">Best Streak</div>
              </div>
            </div>

            {stats.biggestWin && (
              <div className="text-sm mb-3">
                <span className="text-gray-500">Biggest Win:</span>{' '}
                <span className="dark:text-white">
                  {stats.biggestWin.teamScore}-{stats.biggestWin.oppScore} vs {stats.biggestWin.opponent}
                </span>
              </div>
            )}

            <button onClick={handleShare} className="btn-primary w-full">
              📤 Share Recap
            </button>
          </div>
        )
      })()}

      {/* End of season teaser */}
      {currentWeek < 9 && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🎬 Full season highlights available after Week 9!
          </p>
        </div>
      )}
    </div>
  )
}
