import { Badge } from "@/components/ui/badge";
import { useWebSocket } from "@/lib/websocket";

export default function Footer() {
  const { connected } = useWebSocket();
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0 flex items-center space-x-2">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BlockVote. All rights reserved.
            </p>
            <div className="flex items-center">
              <div className={`h-2 w-2 rounded-full mr-1 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-500">
                {connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
              Terms of Service
            </a>
            <a href="#" className="text-gray-500 hover:text-gray-700 text-sm">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}