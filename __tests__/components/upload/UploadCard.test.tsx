import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadCard } from '@/components/upload/UploadCard';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

// Mock the required hooks and fetch
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

global.fetch = jest.fn();

describe('UploadCard Component', () => {
  const mockPush = jest.fn();
  const mockToast = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, reportId: '123' }),
    });
  });

  it('renders the upload component correctly', () => {
    render(<UploadCard />);
    
    // Check for key elements
    expect(screen.getByText('Upload Report')).toBeInTheDocument();
    expect(screen.getByText('Report Type')).toBeInTheDocument();
    expect(screen.getByText('Report File')).toBeInTheDocument();
  });

  it('validates file size correctly', async () => {
    render(<UploadCard />);
    
    const input = screen.getByLabelText('Upload a file');
    
    // Create a file that exceeds the size limit (10MB + 1 byte)
    const oversizedFile = new File(['x'.repeat(10 * 1024 * 1024 + 1)], 'test.pdf', { type: 'application/pdf' });
    
    // Trigger file selection
    fireEvent.change(input, { target: { files: [oversizedFile] } });
    
    // Expect error toast to be called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Invalid file',
          variant: 'destructive',
        })
      );
    });
  });

  it('validates file type correctly', async () => {
    render(<UploadCard />);
    
    const input = screen.getByLabelText('Upload a file');
    
    // Create a file with an invalid type
    const invalidFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
    
    // Trigger file selection
    fireEvent.change(input, { target: { files: [invalidFile] } });
    
    // Expect error toast to be called
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Invalid file',
          variant: 'destructive',
        })
      );
    });
  });

  it('handles structured file upload correctly', async () => {
    render(<UploadCard />);
    
    // Get input element and submit button
    const input = screen.getByLabelText('Upload a file');
    
    // Create a valid CSV file
    const validFile = new File(['test,data'], 'test.csv', { type: 'text/csv' });
    
    // Trigger file selection
    fireEvent.change(input, { target: { files: [validFile] } });
    
    // Get the upload button and click it
    const uploadButton = screen.getByText('Upload Report');
    fireEvent.click(uploadButton);
    
    // Verify that fetch was called with the standard upload endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('routes image files to OCR endpoint', async () => {
    render(<UploadCard />);
    
    // Get input element
    const input = screen.getByLabelText('Upload a file');
    
    // Create a valid image file
    const imageFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
    
    // Trigger file selection
    fireEvent.change(input, { target: { files: [imageFile] } });
    
    // Get the upload button and click it
    const uploadButton = screen.getByText('Upload Report');
    fireEvent.click(uploadButton);
    
    // Verify that fetch was called with the OCR endpoint
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/ocr-upload',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('shows loading state during upload', async () => {
    // Delay the fetch resolution to see loading state
    (global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => 
          resolve({
            ok: true,
            json: async () => ({ success: true, reportId: '123' }),
          }), 
          100
        )
      )
    );
    
    render(<UploadCard />);
    
    // Get input element
    const input = screen.getByLabelText('Upload a file');
    
    // Create a valid file
    const validFile = new File(['test data'], 'test.pdf', { type: 'application/pdf' });
    
    // Trigger file selection
    fireEvent.change(input, { target: { files: [validFile] } });
    
    // Get the upload button and click it
    const uploadButton = screen.getByText('Upload Report');
    fireEvent.click(uploadButton);
    
    // Check that loading state is shown
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });
});
