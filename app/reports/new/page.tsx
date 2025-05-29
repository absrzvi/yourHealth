import { ReportImageUpload } from '@/components/report/ReportImageUpload';

export default function NewReportPage() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Lab Report</h1>
          <p className="text-gray-500">
            Take a photo of your lab report or upload an existing image
          </p>
        </div>
        
        <ReportImageUpload />
        
        <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-100">
          <h2 className="font-medium text-blue-800">Tips for best results:</h2>
          <ul className="mt-2 text-sm text-blue-700 list-disc pl-5 space-y-1">
            <li>Ensure good lighting with no shadows over the report</li>
            <li>Take a clear, straight-on photo of the entire document</li>
            <li>Make sure all text is legible and not blurry</li>
            <li>Avoid glare from glossy paper</li>
            <li>Higher resolution photos yield better extraction results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
