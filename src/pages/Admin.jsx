import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useApp } from '../App'

export default function Admin() {
  const { teams: globalTeams, players: globalPlayers, refreshData } = useApp()
  const [tab, setTab] = useState('scores')
  const [games, setGames] = useState([])
  const [teams, setTeams] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Score entry
  const [selectedGame, setSelectedGame] = useState(null)
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')

  // Schedule editing
  const [editingGame, setEditingGame] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')

  // Team editing
  const [editingTeam, setEditingTeam] = useState(null)
  const [teamName, setTeamName] = useState('')
  const [teamShortName, setTeamShortName] = useState('')
  const [teamColor, setTeamColor] = useState('')
  const [teamMotto, setTeamMotto] = useState('')

  // Player editing
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [playerTeamId, setPlayerTeamId] = useState('')
  const [playerJersey, setPlayerJersey] = useState('')
  const [playerPosition, setPlayerPosition] = useState('')
  const [playerIsCaptain, setPlayerIsCaptain] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)

  // POTW
  const [potwWeek, setPotwWeek] = useState(1)
  const [votes, setVotes] = useState({})
  const [winner, setWinner] = useState(null)

  // PIN management
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')

  // Voting toggle
  const [votingEnabled, setVotingEnabled] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadPOTW()
  }, [potwWeek])

  async function loadData() {
    const [gamesRes, teamsRes, playersRes, settingsRes] = await Promise.all([
      supabase.from('games').select('*').order('week').order('game_time'),
      supabase.from('teams').select('*').order('id'),
      supabase.from('players').select('*').order('name'),
      supabase.from('settings').select('*').eq('key', 'voting_enabled').single()
    ])
    if (gamesRes.data) setGames(gamesRes.data)
    if (teamsRes.data) setTeams(teamsRes.data)
    if (playersRes.data) setPlayers(playersRes.data)
    if (settingsRes.data) setVotingEnabled(settingsRes.data.value === 'true')
    setLoading(false)
  }

  async function loadPOTW() {
    const { data: votesData } = await supabase
      .from('potw_votes')
      .select('player_id')
      .eq('week', potwWeek)

    if (votesData) {
      const counts = {}
      votesData.forEach(v => {
        counts[v.player_id] = (counts[v.player_id] || 0) + 1
      })
      setVotes(counts)
    }

    const { data: winnerData } = await supabase
      .from('potw_winners')
      .select('*')
      .eq('week', potwWeek)
      .single()
    setWinner(winnerData || null)
  }

  async function saveScore(e) {
    e.preventDefault()
    if (!selectedGame) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('games')
      .update({
        home_score: parseInt(homeScore),
        away_score: parseInt(awayScore),
        is_complete: true
      })
      .eq('id', selectedGame.id)

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to save' })
    } else {
      setMessage({ type: 'success', text: 'Score saved!' })
      setSelectedGame(null)
      setHomeScore('')
      setAwayScore('')
      loadData()
    }
  }

  async function clearScore(gameId) {
    if (!confirm('Clear this score?')) return
    await supabase
      .from('games')
      .update({ home_score: null, away_score: null, is_complete: false })
      .eq('id', gameId)
    loadData()
  }

  async function saveGameSchedule(e) {
    e.preventDefault()
    if (!editingGame) return
    setSaving(true)
    setMessage(null)

    const updates = { game_time: editTime }
    if (editDate) updates.game_date = editDate

    const { error } = await supabase
      .from('games')
      .update(updates)
      .eq('id', editingGame.id)

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update schedule' })
    } else {
      setMessage({ type: 'success', text: 'Schedule updated!' })
      setEditingGame(null)
      setEditDate('')
      setEditTime('')
      loadData()
    }
  }

  async function saveTeam(e) {
    e.preventDefault()
    if (!editingTeam) return
    setSaving(true)
    setMessage(null)

    const { error } = await supabase
      .from('teams')
      .update({
        name: teamName,
        short_name: teamShortName,
        color: teamColor,
        motto: teamMotto
      })
      .eq('id', editingTeam.id)

    // Also update team names in games table
    if (!error) {
      await supabase
        .from('games')
        .update({ home_team: teamName })
        .eq('home_team_id', editingTeam.id)
      await supabase
        .from('games')
        .update({ away_team: teamName })
        .eq('away_team_id', editingTeam.id)
    }

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update team' })
    } else {
      setMessage({ type: 'success', text: 'Team updated!' })
      setEditingTeam(null)
      loadData()
      refreshData() // Update global context
    }
  }

  async function savePlayer(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const playerData = {
      name: playerName,
      team_id: playerTeamId ? parseInt(playerTeamId) : null,
      jersey_number: playerJersey ? parseInt(playerJersey) : null,
      position: playerPosition || null,
      is_captain: playerIsCaptain
    }

    let error
    if (editingPlayer) {
      const res = await supabase
        .from('players')
        .update(playerData)
        .eq('id', editingPlayer.id)
      error = res.error
    } else {
      const res = await supabase
        .from('players')
        .insert(playerData)
      error = res.error
    }

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to save player: ' + error.message })
    } else {
      setMessage({ type: 'success', text: editingPlayer ? 'Player updated!' : 'Player added!' })
      resetPlayerForm()
      loadData()
      refreshData() // Update global context
    }
  }

  async function deletePlayer(id) {
    if (!confirm('Delete this player?')) return
    await supabase.from('players').delete().eq('id', id)
    loadData()
    refreshData() // Update global context
  }

  function resetPlayerForm() {
    setEditingPlayer(null)
    setShowAddPlayer(false)
    setPlayerName('')
    setPlayerTeamId('')
    setPlayerJersey('')
    setPlayerPosition('')
    setPlayerIsCaptain(false)
  }

  async function announcePOTW(playerId) {
    if (!confirm('Announce as Player of the Week?')) return

    const { error } = await supabase
      .from('potw_winners')
      .upsert({ week: potwWeek, player_id: playerId }, { onConflict: 'week' })

    if (error) {
      setMessage({ type: 'error', text: 'Failed to announce' })
    } else {
      setMessage({ type: 'success', text: 'POTW announced!' })
      loadPOTW()
    }
  }

  async function changePin(e) {
    e.preventDefault()
    setMessage(null)

    // Verify current PIN
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'admin_pin')
      .single()

    if (data?.value !== currentPin) {
      setMessage({ type: 'error', text: 'Current PIN is incorrect' })
      return
    }

    if (newPin.length < 4) {
      setMessage({ type: 'error', text: 'New PIN must be at least 4 characters' })
      return
    }

    if (newPin !== confirmPin) {
      setMessage({ type: 'error', text: 'New PINs do not match' })
      return
    }

    setSaving(true)
    const { error } = await supabase
      .from('settings')
      .update({ value: newPin, updated_at: new Date().toISOString() })
      .eq('key', 'admin_pin')

    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update PIN' })
    } else {
      setMessage({ type: 'success', text: 'PIN changed successfully!' })
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    }
  }

  async function toggleVoting() {
    const newValue = !votingEnabled
    setSaving(true)
    
    const { error } = await supabase
      .from('settings')
      .update({ value: newValue.toString(), updated_at: new Date().toISOString() })
      .eq('key', 'voting_enabled')
    
    setSaving(false)
    if (error) {
      setMessage({ type: 'error', text: 'Failed to update voting setting: ' + error.message })
    } else {
      setVotingEnabled(newValue)
      setMessage({ type: 'success', text: newValue ? 'Voting enabled!' : 'Voting disabled!' })
    }
  }

  // Group games by week
  const gamesByWeek = games.reduce((acc, g) => {
    if (!acc[g.week]) acc[g.week] = []
    acc[g.week].push(g)
    return acc
  }, {})

  // Ranked players by votes
  const rankedPlayers = players
    .map(p => ({ ...p, votes: votes[p.id] || 0 }))
    .filter(p => p.votes > 0)
    .sort((a, b) => b.votes - a.votes)

  if (loading) {
    return <div className="p-4"><div className="skeleton h-64" /></div>
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto">
        {['scores', 'schedule', 'teams', 'players', 'potw', 'settings'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {t === 'scores' && '📝 Scores'}
            {t === 'schedule' && '📅 Times'}
            {t === 'teams' && '👥 Teams'}
            {t === 'players' && '🏃 Players'}
            {t === 'potw' && '⭐ POTW'}
            {t === 'settings' && '⚙️'}
          </button>
        ))}
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* SCORES TAB */}
      {tab === 'scores' && (
        <>
          {selectedGame ? (
            <form onSubmit={saveScore} className="card mb-4">
              <h3 className="font-medium dark:text-white mb-2">Enter Score</h3>
              <p className="text-xs text-gray-500 mb-3">
                Week {selectedGame.week} • {selectedGame.game_time}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">{selectedGame.home_team}</label>
                  <input
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={e => setHomeScore(e.target.value)}
                    className="input text-center text-xl"
                    required
                    autoFocus
                  />
                </div>
                <span className="text-gray-400 text-xl">—</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">{selectedGame.away_team}</label>
                  <input
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={e => setAwayScore(e.target.value)}
                    className="input text-center text-xl"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setSelectedGame(null); setHomeScore(''); setAwayScore('') }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card mb-4 text-center text-gray-500 dark:text-gray-400 py-4">
              Tap a game to enter score
            </div>
          )}

          {Object.entries(gamesByWeek).map(([week, weekGames]) => (
            <div key={week} className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">
                Week {week} {week === '7' && '(6 games)'} {week === '8' && '(play-in + semis)'} {week === '9' && '(finals)'}
              </h4>
              <div className="space-y-2">
                {weekGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => {
                      setSelectedGame(game)
                      setHomeScore(game.home_score?.toString() || '')
                      setAwayScore(game.away_score?.toString() || '')
                    }}
                    className={`card py-3 flex justify-between items-center cursor-pointer
                      ${selectedGame?.id === game.id ? 'ring-2 ring-primary-500' : ''}
                      ${game.is_complete ? 'opacity-60' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium dark:text-white truncate">
                        {game.home_team} vs {game.away_team}
                      </p>
                      <p className="text-xs text-gray-500">{game.game_time} • Ct {game.court}</p>
                    </div>
                    {game.is_complete ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold dark:text-white">
                          {game.home_score}-{game.away_score}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); clearScore(game.id) }}
                          className="text-red-500 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* SCHEDULE TAB */}
      {tab === 'schedule' && (
        <>
          {editingGame ? (
            <form onSubmit={saveGameSchedule} className="card mb-4">
              <h3 className="font-medium dark:text-white mb-2">Edit Game Time</h3>
              <p className="text-xs text-gray-500 mb-3">
                Week {editingGame.week}: {editingGame.home_team} vs {editingGame.away_team}
              </p>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Date (optional)</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Time</label>
                  <input
                    type="text"
                    value={editTime}
                    onChange={e => setEditTime(e.target.value)}
                    placeholder="e.g. 6:00 PM"
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => { setEditingGame(null); setEditDate(''); setEditTime('') }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card mb-4 text-center text-gray-500 dark:text-gray-400 py-4">
              Tap a game to change its date/time
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            💡 Changes are pushed automatically to all users.
          </p>

          {Object.entries(gamesByWeek).map(([week, weekGames]) => (
            <div key={week} className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">Week {week}</h4>
              <div className="space-y-2">
                {weekGames.map(game => (
                  <div
                    key={game.id}
                    onClick={() => {
                      setEditingGame(game)
                      setEditDate(game.game_date || '')
                      setEditTime(game.game_time || '')
                    }}
                    className={`card py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${editingGame?.id === game.id ? 'ring-2 ring-primary-500' : ''}`}
                  >
                    <p className="text-sm font-medium dark:text-white">
                      {game.home_team} vs {game.away_team}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      {game.game_date && (
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                          📅 {new Date(game.game_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        🕐 {game.game_time}
                      </span>
                      <span>Ct {game.court}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* TEAMS TAB */}
      {tab === 'teams' && (
        <>
          {editingTeam ? (
            <form onSubmit={saveTeam} className="card mb-4">
              <h3 className="font-medium dark:text-white mb-3">Edit Team</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Team Name</label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Short Name (3 letters)</label>
                  <input
                    type="text"
                    value={teamShortName}
                    onChange={e => setTeamShortName(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={teamColor}
                      onChange={e => setTeamColor(e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={teamColor}
                      onChange={e => setTeamColor(e.target.value)}
                      className="input flex-1"
                      placeholder="#1e3a5f"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Motto (optional)</label>
                  <input
                    type="text"
                    value={teamMotto}
                    onChange={e => setTeamMotto(e.target.value)}
                    className="input"
                    placeholder="Team slogan"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Team'}
                </button>
              </div>
            </form>
          ) : (
            <div className="card mb-4 text-center text-gray-500 dark:text-gray-400 py-4">
              Tap a team to edit
            </div>
          )}

          <div className="space-y-2">
            {teams.map(team => (
              <div
                key={team.id}
                onClick={() => {
                  setEditingTeam(team)
                  setTeamName(team.name)
                  setTeamShortName(team.short_name)
                  setTeamColor(team.color || '#1e3a5f')
                  setTeamMotto(team.motto || '')
                }}
                className={`card py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50
                  ${editingTeam?.id === team.id ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team.color }}
                >
                  {team.short_name}
                </div>
                <div className="flex-1">
                  <p className="font-medium dark:text-white">{team.name}</p>
                  {team.motto && <p className="text-xs text-gray-500">{team.motto}</p>}
                </div>
                <span className="text-xs text-gray-400">
                  {players.filter(p => p.team_id === team.id).length} players
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PLAYERS TAB */}
      {tab === 'players' && (
        <>
          {(editingPlayer || showAddPlayer) ? (
            <form onSubmit={savePlayer} className="card mb-4">
              <h3 className="font-medium dark:text-white mb-3">
                {editingPlayer ? 'Edit Player' : 'Add Player'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Name</label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={e => setPlayerName(e.target.value)}
                    className="input"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Team</label>
                  <select
                    value={playerTeamId}
                    onChange={e => setPlayerTeamId(e.target.value)}
                    className="input"
                  >
                    <option value="">No team</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Jersey #</label>
                    <input
                      type="number"
                      value={playerJersey}
                      onChange={e => setPlayerJersey(e.target.value)}
                      className="input"
                      min="0"
                      max="99"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Position</label>
                    <select
                      value={playerPosition}
                      onChange={e => setPlayerPosition(e.target.value)}
                      className="input"
                    >
                      <option value="">—</option>
                      <option value="guard">Guard</option>
                      <option value="forward">Forward</option>
                      <option value="center">Center</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm dark:text-white">
                  <input
                    type="checkbox"
                    checked={playerIsCaptain}
                    onChange={e => setPlayerIsCaptain(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Team Captain
                </label>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetPlayerForm}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1" disabled={saving}>
                  {saving ? 'Saving...' : (editingPlayer ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddPlayer(true)}
              className="btn-primary w-full mb-4"
            >
              + Add Player
            </button>
          )}

          {teams.map(team => {
            const teamPlayers = players.filter(p => p.team_id === team.id)
            if (teamPlayers.length === 0) return null
            return (
              <div key={team.id} className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                  {team.name}
                </h4>
                <div className="space-y-2">
                  {teamPlayers.map(player => (
                    <div
                      key={player.id}
                      onClick={() => {
                        setEditingPlayer(player)
                        setPlayerName(player.name)
                        setPlayerTeamId(player.team_id?.toString() || '')
                        setPlayerJersey(player.jersey_number?.toString() || '')
                        setPlayerPosition(player.position || '')
                        setPlayerIsCaptain(player.is_captain || false)
                      }}
                      className={`card py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50
                        ${editingPlayer?.id === player.id ? 'ring-2 ring-primary-500' : ''}`}
                    >
                      <span className="w-8 text-center font-bold text-gray-400">
                        #{player.jersey_number || '?'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium dark:text-white">
                          {player.name}
                          {player.is_captain && <span className="text-yellow-500 ml-1">©</span>}
                        </p>
                        {player.position && (
                          <p className="text-xs text-gray-500 capitalize">{player.position}</p>
                        )}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); deletePlayer(player.id) }}
                        className="text-red-500 text-xs px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Unassigned players */}
          {players.filter(p => !p.team_id).length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">Unassigned</h4>
              <div className="space-y-2">
                {players.filter(p => !p.team_id).map(player => (
                  <div
                    key={player.id}
                    onClick={() => {
                      setEditingPlayer(player)
                      setPlayerName(player.name)
                      setPlayerTeamId('')
                      setPlayerJersey(player.jersey_number?.toString() || '')
                      setPlayerPosition(player.position || '')
                      setPlayerIsCaptain(player.is_captain || false)
                    }}
                    className="card py-2 flex items-center gap-3 cursor-pointer"
                  >
                    <span className="w-8 text-center font-bold text-gray-400">
                      #{player.jersey_number || '?'}
                    </span>
                    <p className="flex-1 font-medium dark:text-white">{player.name}</p>
                    <button
                      onClick={e => { e.stopPropagation(); deletePlayer(player.id) }}
                      className="text-red-500 text-xs px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* POTW TAB */}
      {tab === 'potw' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold dark:text-white">Player of the Week</h3>
            <select
              value={potwWeek}
              onChange={e => setPotwWeek(parseInt(e.target.value))}
              className="input w-auto"
            >
              {[1, 2, 3, 4, 5, 6, 7].map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>

          {winner && (
            <div className="card bg-yellow-50 dark:bg-yellow-900/20 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                ✓ Winner: <strong>{players.find(p => p.id === winner.player_id)?.name}</strong>
              </p>
            </div>
          )}

          {rankedPlayers.length === 0 ? (
            <div className="card text-center text-gray-500 py-6">
              No votes yet for Week {potwWeek}
            </div>
          ) : (
            <div className="space-y-2">
              {rankedPlayers.map((player, idx) => {
                const team = teams.find(t => t.id === player.team_id)
                const isWinner = winner?.player_id === player.id
                return (
                  <div
                    key={player.id}
                    onClick={() => !winner && announcePOTW(player.id)}
                    className={`card flex items-center gap-3 cursor-pointer
                      ${isWinner ? 'ring-2 ring-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : ''}
                      ${!winner ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
                  >
                    <span className="w-6 text-center font-bold text-gray-400">{idx + 1}</span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: team?.color }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium dark:text-white">{player.name}</p>
                      <p className="text-xs text-gray-500">{team?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-500">{player.votes}</p>
                      <p className="text-xs text-gray-400">votes</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <form onSubmit={changePin} className="card">
            <h3 className="font-medium dark:text-white mb-3">Change Admin PIN</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Current PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={currentPin}
                  onChange={e => setCurrentPin(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={newPin}
                  onChange={e => setNewPin(e.target.value)}
                  className="input"
                  placeholder="At least 4 characters"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)}
                  className="input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-4" disabled={saving}>
              {saving ? 'Saving...' : 'Change PIN'}
            </button>
          </form>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium dark:text-white">Weekly Voting</h3>
                <p className="text-xs text-gray-500">Allow users to vote for Player of the Week</p>
              </div>
              <button
                onClick={toggleVoting}
                disabled={saving}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  votingEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                  votingEnabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium dark:text-white mb-2">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Teams:</span> <span className="dark:text-white">{teams.length}</span></div>
              <div><span className="text-gray-500">Players:</span> <span className="dark:text-white">{players.length}</span></div>
              <div><span className="text-gray-500">Games:</span> <span className="dark:text-white">{games.length}</span></div>
              <div><span className="text-gray-500">Completed:</span> <span className="dark:text-white">{games.filter(g => g.is_complete).length}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-medium dark:text-white mb-2">About</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              QBA League App v1.0
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
