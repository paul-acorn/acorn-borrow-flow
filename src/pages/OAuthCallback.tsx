import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const OAuthCallback = () => {
  const location = useLocation();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authCode = params.get('code');
    const authError = params.get('error');

    if (authError) {
      setError(authError);
    } else if (authCode) {
      setCode(authCode);
    }
  }, [location]);

  const copyToClipboard = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Google OAuth Authorization</CardTitle>
          <CardDescription>
            Complete the OAuth flow to get your refresh token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Authorization error: {error}
              </AlertDescription>
            </Alert>
          )}

          {code && (
            <>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Authorization successful! Copy the code below.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <label className="text-sm font-medium">Authorization Code:</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded text-sm break-all">
                    {code}
                  </code>
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    size="icon"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Alert>
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Next Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Copy the authorization code above</li>
                    <li>Go back to the chat with Lovable</li>
                    <li>Paste the code and follow the instructions to get your refresh token</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </>
          )}

          {!code && !error && (
            <Alert>
              <AlertDescription>
                Waiting for authorization response...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OAuthCallback;
