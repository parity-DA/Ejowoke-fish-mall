import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface InvitationEmailProps {
  invitedEmail: string;
  temporaryPassword: string;
  role: string;
  inviterName: string;
  loginUrl: string;
}

export const InvitationEmail = ({
  invitedEmail,
  temporaryPassword,
  role,
  inviterName,
  loginUrl,
}: InvitationEmailProps) => {
  const roleDisplay = role.replace('_', ' ').split(' ').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');

  return (
    <Html>
      <Head />
      <Preview>You've been invited to EJowoke Fish Mall & Logistics</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to EJowoke Fish Mall & Logistics!</Heading>
          
          <Text style={text}>
            Hello,
          </Text>
          
          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join <strong>EJowoke Fish Mall & Logistics</strong> with <strong>{roleDisplay}</strong> access.
          </Text>

          <Section style={loginSection}>
            <Text style={text}>
              <strong>Your login credentials:</strong>
            </Text>
            <Text style={credentialText}>
              <strong>Email:</strong> {invitedEmail}
            </Text>
            <Text style={credentialText}>
              <strong>Temporary Password:</strong> <code style={code}>{temporaryPassword}</code>
            </Text>
          </Section>

          <Link
            href={loginUrl}
            target="_blank"
            style={button}
          >
            Login to Your Account
          </Link>

          <Hr style={hr} />

          <Text style={smallText}>
            <strong>Important:</strong> Please change your password after your first login for security reasons.
          </Text>

          <Text style={smallText}>
            Your role as <strong>{roleDisplay}</strong> gives you access to manage the fish mall operations including inventory, sales, customers, and reports.
          </Text>

          <Text style={footer}>
            If you have any questions, please contact your administrator.
            <br />
            <strong>EJowoke Fish Mall & Logistics</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default InvitationEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '580px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  margin: '16px 0',
};

const credentialText = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  padding: '0 40px',
  margin: '8px 0',
};

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 40px',
  margin: '16px 0',
};

const loginSection = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e9ecef',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px',
};

const button = {
  backgroundColor: '#007cba',
  borderRadius: '8px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: 'bold',
  lineHeight: '50px',
  margin: '24px 40px',
  padding: '0 20px',
  textAlign: 'center' as const,
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e9ecef',
  margin: '20px 40px',
};

const code = {
  backgroundColor: '#f4f4f4',
  border: '1px solid #ddd',
  borderRadius: '4px',
  color: '#333',
  fontFamily: 'Consolas, "Courier New", monospace',
  fontSize: '14px',
  padding: '2px 6px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '22px',
  margin: '32px 40px 0',
  textAlign: 'center' as const,
};
