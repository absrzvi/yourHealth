import { RefreshCw, PlusCircle, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';

export function ClaimsOverview() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Claims Overview</h3>
          <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3">
            <RefreshCw className="h-4 w-4" />
            <span className="ml-2">Refresh</span>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded p-4">
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-gray-600">Total Claims</div>
          </div>
          <div className="bg-blue-50 rounded p-4">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
          <div className="bg-green-50 rounded p-4">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-red-50 rounded p-4">
            <div className="text-2xl font-bold text-red-600">4</div>
            <div className="text-sm text-gray-600">Denied</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link href="/claims/new">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
              <PlusCircle className="h-4 w-4 mr-2" />
              New Claim
            </button>
          </Link>
          <Link href="/claims">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <ClipboardList className="h-4 w-4 mr-2" />
              View All Claims
            </button>
          </Link>
          <Link href="/insurance">
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <FileText className="h-4 w-4 mr-2" />
              Manage Insurance
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
