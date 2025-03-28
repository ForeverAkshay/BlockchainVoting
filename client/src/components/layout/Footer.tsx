export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} BlockVote. All rights reserved.
            </p>
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