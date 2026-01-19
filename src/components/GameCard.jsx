import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

const REACTIONS = ['🔥', '💪', '👏', '😮', '😭', '❤️']

export default function GameCard({ game, expanded = false }) {
  const { userId, teams, players, isAdmin } = useApp()
  const [reactions, setReactions] = useState({})
  const [userReaction, setUserReaction] = useState(null)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showRsvp, setShowRsvp] = useState(false)
  const [rsvps, setRsvps] = useState([])
  const [copied, setCopied] = useState(false)
  const cardRef = useRef(null)

  const homeTeam = teams.find(t => t.id === game.home_team_id)
  const awayTeam = teams.find(t => t.id === game.away_team_id)
  const hasScore = game.home_score != null && game.away_score != null
  const homeWon = hasScore && game.home_score > game.away_score
  const awayWon = hasScore && game.away_score > game.home_score

  // Fetch reactions for completed games
  useEffect(() => {
    if (!hasScore || !userId) return

    supabase
      .from('game_reactions')
      .select('reaction, user_id')
      .eq('game_id', game.id)
      .then(({ data }) => {
        if (!data) return
        const counts = {}
        data.forEach(r => {
          counts[r.reaction] = (counts[r.reaction] || 0) + 1
          if (r.user_id === userId) setUserReaction(r.reaction)
        })
        setReactions(counts)
      })
  }, [game.id, hasScore, userId])

  // Fetch RSVPs for upcoming games
  useEffect(() => {
    if (hasScore) return

    supabase
      .from('rsvps')
      .select('*, players(name)')
      .eq('game_id', game.id)
      .then(({ data }) => {
        if (data) setRsvps(data)
      })

    // Subscribe to changes
    const channel = supabase
      .channel(`rsvp-${game.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rsvps',
        filter: `game_id=eq.${game.id}`
      }, () => {
        supabase
          .from('rsvps')
          .select('*, players(name)')
          .eq('game_id', game.id)
          .then(({ data }) => { if (data) setRsvps(data) })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [game.id, hasScore])

  // Handle reaction
  async function handleReaction(emoji) {
    if (!userId) return
    const prev = userReaction

    // Optimistic update
    setUserReaction(emoji)
    setReactions(r => ({
      ...r,
      [prev]: Math.max(0, (r[prev] || 0) - 1),
      [emoji]: (r[emoji] || 0) + 1
    }))
    setShowReactionPicker(false)

    try {
      await supabase.from('game_reactions').upsert({
        game_id: game.id,
        user_id: userId,
        reaction: emoji
      }, { onConflict: 'game_id,user_id' })
    } catch (e) {
      setUserReaction(prev) // Revert
    }
  }

  // Share game
  async function handleShare() {
    const text = hasScore
      ? `${game.home_team} ${game.home_score} - ${game.away_score} ${game.away_team} 🏀 #QBA`
      : `${game.home_team} vs ${game.away_team} • ${game.game_time} 🏀 #QBA`

    if (navigator.share) {
      try { await navigator.share({ text }) } catch {}
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const gameTypeBadge = {
    final: { text: '🏆 Championship', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' },
    semifinal: { text: 'Semifinal', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
    playin: { text: 'Play-in', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
    third_place: { text: '3rd Place', class: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  }[game.game_type]

  const yesCount = rsvps.filter(r => r.status === 'yes').length
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length

  return (
    <div ref={cardRef} className="card relative overflow-hidden animate-slide-up">
      {/* Team color accents */}
      {homeTeam && (
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: homeTeam.color }} />
      )}
      {awayTeam && (
        <div className="absolute right-0 top-0 bottom-0 w-1 rounded-r-2xl" style={{ backgroundColor: awayTeam.color }} />
      )}

      {/* Game type badge */}
      {gameTypeBadge && (
        <div className="mb-2">
          <span className={`badge ${gameTypeBadge.class}`}>{gameTypeBadge.text}</span>
        </div>
      )}

      {/* Teams & scores */}
      <div className="flex items-center justify-between px-2">
        {/* Home */}
        <div className={`flex-1 ${homeWon ? 'font-bold' : ''}`}>
          <div className="text-base dark:text-white truncate">{game.home_team}</div>
          {hasScore && (
            <div className={`text-3xl font-bold mt-1 ${homeWon ? 'text-primary-500' : 'text-gray-400'}`}>
              {game.home_score}
            </div>
          )}
        </div>

        {/* Center */}
        <div className="px-4 text-center">
          {hasScore ? (
            <span className="text-xs text-gray-400 uppercase font-medium">Final</span>
          ) : (
            <span className="text-lg text-gray-300 dark:text-gray-600 font-light">vs</span>
          )}
        </div>

        {/* Away */}
        <div className={`flex-1 text-right ${awayWon ? 'font-bold' : ''}`}>
          <div className="text-base dark:text-white truncate">{game.away_team}</div>
          {hasScore && (
            <div className={`text-3xl font-bold mt-1 ${awayWon ? 'text-primary-500' : 'text-gray-400'}`}>
              {game.away_score}
            </div>
          )}
        </div>
      </div>

      {/* Game details */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        <span>
          {game.game_date && (
            <span className="mr-2">
              📅 {new Date(game.game_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          🕐 {game.game_time}
        </span>
        <span>📍 Court {game.court}</span>
        <button onClick={handleShare} className="hover:text-primary-500 relative">
          📤 Share
          {copied && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Copied!
            </span>
          )}
        </button>
      </div>

      {/* Reactions for completed games */}
      {hasScore && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(reactions)
              .filter(([, c]) => c > 0)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`reaction-pill ${userReaction === emoji ? 'selected' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{count}</span>
                </button>
              ))}

            {/* Add reaction */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500"
              >
                {userReaction ? '✓' : '+'}
              </button>

              {showReactionPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-10 animate-slide-up">
                  {REACTIONS.map(e => (
                    <button
                      key={e}
                      onClick={() => handleReaction(e)}
                      className={`text-xl p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:scale-110 ${userReaction === e ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* RSVP for upcoming games */}
      {!hasScore && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setShowRsvp(!showRsvp)}
            className="w-full flex items-center justify-between text-sm"
          >
            <span className="font-medium dark:text-white">Who's coming?</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-600 dark:text-green-400">✓ {yesCount}</span>
              {maybeCount > 0 && <span className="text-yellow-600">? {maybeCount}</span>}
              <span className="text-gray-400">{showRsvp ? '▲' : '▼'}</span>
            </div>
          </button>

          {showRsvp && (
            <div className="mt-3 space-y-2 animate-slide-up">
              {rsvps.filter(r => r.status === 'yes').length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rsvps.filter(r => r.status === 'yes').map(r => (
                    <span key={r.id} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                      {r.players?.name || 'Player'}
                    </span>
                  ))}
                </div>
              )}
              {rsvps.filter(r => r.status === 'maybe').length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rsvps.filter(r => r.status === 'maybe').map(r => (
                    <span key={r.id} className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
                      {r.players?.name || 'Player'} (maybe)
                    </span>
                  ))}
                </div>
              )}
              {rsvps.length === 0 && (
                <p className="text-xs text-gray-400">No RSVPs yet</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
