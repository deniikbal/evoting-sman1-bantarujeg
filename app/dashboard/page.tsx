import { VotingOverviewCards } from "@/components/voting-overview-cards"
import { VotingResultsChart } from "@/components/voting-results-chart"
import { RecentVotingActivity } from "@/components/recent-voting-activity"

export default function Page() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">E-Voting Dashboard</h1>
          <p className="text-gray-600">
            Sistem Pemilihan Ketua OSIS - SMAN 1 Bantarujeg
          </p>
        </div>
        <VotingOverviewCards />
        <div className="px-4 lg:px-6">
          <VotingResultsChart />
        </div>
        <div className="px-4 lg:px-6">
          <RecentVotingActivity />
        </div>
      </div>
    </div>
  )
}