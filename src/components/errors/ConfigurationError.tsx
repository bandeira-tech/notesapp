import { AlertTriangle, FileText, Terminal } from "lucide-react";

interface ConfigurationErrorProps {
  error: string;
}

export function ConfigurationError({ error }: ConfigurationErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl border-2 border-red-200 overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 text-white p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={32} />
            <div>
              <h1 className="text-2xl font-bold">Configuration Required</h1>
              <p className="text-red-100 mt-1">
                Firecat Notes needs to be configured before it can start
              </p>
            </div>
          </div>
        </div>

        {/* Error Details */}
        <div className="p-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-2">Error Details:</h3>
            <pre className="text-sm text-red-800 whitespace-pre-wrap font-mono">
              {error}
            </pre>
          </div>

          {/* Setup Instructions */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Terminal size={20} />
              Quick Setup
            </h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      Create your environment file
                    </p>
                    <code className="block bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      cp .env.example .env
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      Edit .env with your B3nd node URLs
                    </p>
                    <div className="bg-gray-900 text-gray-300 p-3 rounded font-mono text-sm">
                      <div className="text-gray-500"># For local development</div>
                      <div>
                        <span className="text-blue-400">VITE_B3ND_BACKEND</span>
                        =http://localhost:9942
                      </div>
                      <div>
                        <span className="text-blue-400">VITE_B3ND_WALLET</span>
                        =http://localhost:9943
                      </div>
                      <div>
                        <span className="text-blue-400">VITE_B3ND_APP</span>
                        =http://localhost:9944
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-2">
                      Restart the development server
                    </p>
                    <code className="block bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                      npm run dev
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Documentation Link */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-1">
                  Need more help?
                </h4>
                <p className="text-sm text-blue-800">
                  Check out <code className="bg-blue-100 px-1 rounded">CONFIGURATION.md</code> for detailed
                  setup instructions, troubleshooting, and advanced configuration options.
                </p>
              </div>
            </div>
          </div>

          {/* B3nd Node Info */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Don't have B3nd nodes running?
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Start your local B3nd nodes with these commands:
            </p>
            <div className="space-y-2">
              <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-sm">
                b3nd-data-node start --port 9942
              </code>
              <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-sm">
                b3nd-wallet-node start --port 9943
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
