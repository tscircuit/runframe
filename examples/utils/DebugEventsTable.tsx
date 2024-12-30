import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"

export const DebugEventsTable = () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)

  return (
    <div className="p-4">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">Event Type</th>
            <th className="border border-gray-300 p-2">Created At</th>
            <th className="border border-gray-300 p-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {recentEvents
            .sort(
              (a, b) =>
                new Date(b.created_at).valueOf() -
                new Date(a.created_at).valueOf(),
            )
            .map(({ event_type, event_id, created_at, ...rest }) => (
              <tr key={event_id}>
                <td className="border border-gray-300 p-2">{event_type}</td>
                <td className="border border-gray-300 p-2">
                  {new Date(created_at).toLocaleString()}
                </td>
                <td className="border border-gray-300 p-2">
                  {JSON.stringify(rest)
                    .slice(1, -1)
                    .replace(/"([^"]+)":/g, "$1:")}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}
