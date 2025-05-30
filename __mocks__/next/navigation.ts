// Mock for next/navigation
export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  refresh: jest.fn(),
});

export const usePathname = jest.fn(() => '/');

export const useSearchParams = () => ({
  get: jest.fn(),
});

export const useParams = () => ({});

export const notFound = () => {
  const error = new Error('Not Found');
  (error as any).digest = 'NEXT_NOT_FOUND';
  throw error;
};

export const redirect = (path: string) => {
  const error = new Error('Redirect');
  (error as any).digest = `NEXT_REDIRECT;${path}`;
  throw error;
};

export const permanentRedirect = redirect;
