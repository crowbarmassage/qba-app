import { Link } from 'react-router-dom'
import { useApp } from '../App'

export default function Teams() {
  const { teams, players } = useApp()

  // Group players by team
  const byTeam = players.reduce((acc, p) => {
    if (!acc[p.team_id]) acc[p.team_id] = []
    acc[p.team_id].push(p)
    return acc
  }, {})

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4 dark:text-white">Teams</h2>

      <div className="space-y-3">
        {teams.map(team => {
          const roster = byTeam[team.id] || []
          const captain = roster.find(p => p.is_captain)

          return (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className="avatar-lg shrink-0"
                style={{ backgroundColor: team.color }}
              >
                {team.short_name}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold dark:text-white">{team.name}</h3>
                {team.motto && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic truncate">
                    "{team.motto}"
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{roster.length} players</span>
                  {captain && <span>• Capt: {captain.name.split(' ')[0]}</span>}
                </div>
              </div>

              <span className="text-gray-300 dark:text-gray-600 text-lg">→</span>
            </Link>
          )
        })}
      </div>

      {teams.length === 0 && (
        <div className="card text-center py-8 text-gray-500 dark:text-gray-400">
          No teams loaded. Check database connection.
        </div>
      )}
    </div>
  )
}
