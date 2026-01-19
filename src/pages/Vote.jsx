import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function Vote() {
  const { userId, teams, players } = useApp()
  const [week, setWeek] = useState(1)
  const [votes, setVotes] = useState({})
  const [userVote, setUserVote] = useState(null)
  const [winner, setWinner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [votingEnabled, setVotingEnabled] = useState(true)

  // Check if voting is enabled
  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'voting_enabled')
      .single()
      .then(({ data }) => {
        if (data) setVotingEnabled(data.value === 'true')
      })
  }, [])

  // Determine current week
  useEffect(() => {
    supabase
      .from('games')
      .select('week')
      .eq('is_complete', true)
      .order('week', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const lastWeek = data?.[0]?.week || 1
        setWeek(lastWeek)
      })
  }, [])

  // Fetch votes for selected week
  useEffect(() => {
    async function load() {
      setLoading(true)

      // Check for winner
      const { data: winnerData } = await supabase
        .from('potw_winners')
        .select('*, players(*)')
        .eq('week', week)
        .single()

      setWinner(winnerData)

      // Get votes
      const { data: votesData } = await supabase
        .from('potw_votes')
        .select('player_id, voter_id')
        .eq('week', week)

      if (votesData) {
        const counts = {}
        votesData.forEach(v => {
          counts[v.player_id] = (counts[v.player_id] || 0) + 1
          if (v.voter_id === userId) setUserVote(v.player_id)
        })
        setVotes(counts)
      }

      setLoading(false)
    }

    if (userId) load()
  }, [week, userId])

  // Submit vote
  async function handleVote(playerId) {
    if (userVote || submitting) return
    setSubmitting(true)

    try {
      await supabase.from('potw_votes').insert({
        week,
        player_id: playerId,
        voter_id: userId
      })

      setUserVote(playerId)
      setVotes(prev => ({
        ...prev,
        [playerId]: (prev[playerId] || 0) + 1
      }))
    } catch (e) {
      alert('Could not submit vote')
    } finally {
      setSubmitting(false)
    }
  }

  // Group players by team
  const byTeam = players.reduce((acc, p) => {
    const team = teams.find(t => t.id === p.team_id)
    if (!team) return acc
    if (!acc[team.id]) acc[team.id] = { team, players: [] }
    acc[team.id].players.push(p)
    return acc
  }, {})

  // Ranked players
  const ranked = players
    .map(p => ({ ...p, voteCount: votes[p.id] || 0 }))
    .filter(p => p.voteCount > 0)
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, 5)

  const weeks = Array.from({ length: 9 }, (_, i) => i + 1)

  if (loading) {
    return (
      <div className="p-4">
        <div className="skeleton h-10 w-48 mb-4" />
        <div className="skeleton h-32 mb-3" />
        <div className="skeleton h-48" />
      </div>
    )
  }

  if (!votingEnabled) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold dark:text-white mb-4">Player of the Week</h2>
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🗳️</p>
          <h3 className="font-semibold dark:text-white mb-2">Voting is Currently Disabled</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check back later when voting opens for the next week!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold dark:text-white">Player of the Week</h2>
        <select
          value={week}
          onChange={e => { setWeek(parseInt(e.target.value)); setUserVote(null) }}
          className="text-sm bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2 dark:text-white"
        >
          {weeks.map(w => <option key={w} value={w}>Week {w}</option>)}
        </select>
      </div>

      {/* Winner announcement */}
      {winner && (
        <div className="card bg-gradient-to-r from-yellow-400 to-orange-500 text-white mb-4">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🏆</span>
            <div>
              <div className="text-sm opacity-80">Week {week} Winner</div>
              <div className="text-xl font-bold">{winner.players?.name}</div>
              {winner.announcement && (
                <div className="text-sm mt-1 opacity-90">{winner.announcement}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vote status */}
      {!winner && (
        <div className={`card mb-4 ${userVote ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
          {userVote ? (
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-medium dark:text-white">Vote submitted!</div>
                <div className="text-sm text-gray-500">
                  You voted for {players.find(p => p.id === userVote)?.name}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-2xl">⭐</span>
              <div>
                <div className="font-medium dark:text-white">Cast your vote</div>
                <div className="text-sm text-gray-500">Who stood out in Week {week}?</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rankings */}
      {(userVote || winner) && ranked.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Current Standings
          </h3>
          <div className="space-y-2">
            {ranked.map((player, idx) => {
              const team = teams.find(t => t.id === player.team_id)
              return (
                <div
                  key={player.id}
                  className={`card flex items-center gap-3 py-3
                    ${idx === 0 ? 'ring-2 ring-yellow-400' : ''}
                    ${player.id === userVote ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
                >
                  <div className="w-6 text-center font-bold text-gray-400">
                    {idx === 0 ? '👑' : idx + 1}
                  </div>
                  <div className="avatar" style={{ backgroundColor: team?.color }}>
                    {player.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium dark:text-white">{player.name}</div>
                    <div className="text-xs text-gray-500">{team?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-500">{player.voteCount}</div>
                    <div className="text-xs text-gray-400">votes</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Voting interface */}
      {!userVote && !winner && (
        <div className="space-y-4">
          {Object.values(byTeam).map(({ team, players: teamPlayers }) => (
            <div key={team.id}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: team.color }}>
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                {team.name}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {teamPlayers.map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleVote(player.id)}
                    disabled={submitting}
                    className="card flex items-center gap-2 py-3 text-left
                      hover:ring-2 hover:ring-primary-500 transition-all
                      disabled:opacity-50"
                  >
                    {player.photo_url ? (
                      <img src={player.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="avatar" style={{ backgroundColor: team.color }}>
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate dark:text-white">{player.name}</div>
                      {player.jersey_number && (
                        <div className="text-xs text-gray-500">#{player.jersey_number}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {players.length === 0 && (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No players registered yet.
        </div>
      )}
    </div>
  )
}
