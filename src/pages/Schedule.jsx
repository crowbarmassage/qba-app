import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import GameCard from '../components/GameCard'

export default function Schedule() {
  const [games, setGames] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('games')
        .select('*')
        .order('week')
        .order('game_time')
        .order('court')

      if (data) {
        setGames(data)
        // Find current week (first incomplete or last week)
        const incomplete = data.find(g => !g.is_complete)
        setSelectedWeek(incomplete?.week || 9)
      }
      setLoading(false)
    }
    load()

    // Realtime subscription
    const channel = supabase
      .channel('games-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'games'
      }, ({ new: newGame }) => {
        if (newGame) {
          setGames(prev => prev.map(g => g.id === newGame.id ? newGame : g))
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  const weeks = [...new Set(games.map(g => g.week))].sort((a, b) => a - b)
  
  // Sort games by date, then time, then court
  const weekGames = games
    .filter(g => g.week === selectedWeek)
    .sort((a, b) => {
      // First sort by date
      const dateA = a.game_date || '9999-99-99'
      const dateB = b.game_date || '9999-99-99'
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      
      // Then sort by time
      const parseTime = (t) => {
        if (!t) return 0
        const match = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
        if (!match) return 0
        let hours = parseInt(match[1])
        const mins = parseInt(match[2])
        const isPM = match[3].toUpperCase() === 'PM'
        if (isPM && hours !== 12) hours += 12
        if (!isPM && hours === 12) hours = 0
        return hours * 100 + mins
      }
      
      const timeA = parseTime(a.game_time)
      const timeB = parseTime(b.game_time)
      
      if (timeA !== timeB) return timeA - timeB
      
      // Finally sort by court
      return (a.court || 0) - (b.court || 0)
    })

  const weekLabel = (w) => {
    if (w === 9) return 'Finals'
    if (w === 8) return 'Semis'
    if (w === 7) return 'Wk 7'
    return `Wk ${w}`
  }

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton w-16 h-10 rounded-full shrink-0" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-36 mb-3" />)}
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
        {weeks.map(w => (
          <button
            key={w}
            onClick={() => setSelectedWeek(w)}
            className={`week-pill ${selectedWeek === w ? 'week-pill-active' : 'week-pill-inactive'}`}
          >
            {weekLabel(w)}
          </button>
        ))}
      </div>

      {/* Week header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold dark:text-white">
          {selectedWeek === 9 ? 'Championship Week' :
           selectedWeek === 8 ? 'Week 8 — Play-in & Semifinals' :
           selectedWeek === 7 ? 'Week 7 — Final Regular Season' :
           `Week ${selectedWeek}`}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {weekGames.filter(g => g.is_complete).length} of {weekGames.length} games completed
          {selectedWeek === 7 && ' (extended session)'}
        </p>
      </div>

      {/* Games */}
      <div className="space-y-3">
        {weekGames.map(game => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>

      {/* Playoff format hint */}
      {(selectedWeek === 8 || selectedWeek === 9) && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <h3 className="font-medium text-sm mb-2 dark:text-white">Playoff Format</h3>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• <strong>#1 & #2</strong> get first-round bye</li>
            <li>• <strong>Play-in:</strong> #3 vs #6, #4 vs #5</li>
            <li>• <strong>Semis:</strong> #1 vs (4/5 winner), #2 vs (3/6 winner)</li>
            <li>• <strong>Finals:</strong> Winner takes all 🏆</li>
          </ul>
        </div>
      )}
    </div>
  )
}
