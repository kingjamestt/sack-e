import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface TransferNotificationProps {
  senderName: string;
  eventName: string;
  eventDate: string;
  transferLink: string;
}

export const TransferNotification = ({
  senderName = 'A friend',
  eventName = 'Sack-E',
  eventDate = 'TBA',
  transferLink = 'https://sackie-online.web.app',
}: TransferNotificationProps) => (
  <Html>
    <Head />
    <Preview>{senderName} sent you a ticket for {eventName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img 
            src="https://sackie-online.web.app/sack-e-logo.jpeg" 
            alt="Sack-E" 
            height="40" 
            style={{ margin: '0 auto' }} 
          />
        </Section>
        
        <Section style={content}>
          <Heading style={title}>You've been sent a ticket!</Heading>
          
          <Text style={text}>Hi there,</Text>
          <Text style={text}>
            {senderName} has transferred a ticket to you for <strong>{eventName}</strong> happening on {eventDate}.
          </Text>

          <Section style={orderBox}>
            <Text style={orderText}><strong>Event:</strong> {eventName}</Text>
            <Text style={orderText}><strong>Event Date:</strong> {eventDate}</Text>
            <Text style={orderText}><strong>From:</strong> {senderName}</Text>
          </Section>

          <Text style={text}>
            To accept this ticket and add it to your secure digital wallet, please click the button below and log in to your account.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={transferLink}>
              Accept Ticket
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Text style={footer}>
            If you have any questions, reply to this email or contact support.
            <br /><br />
            © {new Date().getFullYear()} Sack-E Online. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default TransferNotification;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const header = {
  backgroundColor: '#0B4DE5',
  padding: '32px 48px',
  textAlign: 'center' as const,
};

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '0 48px',
};

const title = {
  fontSize: '24px',
  lineHeight: '1.25',
  color: '#0a1628',
  fontWeight: 'bold',
  marginTop: '32px',
  marginBottom: '24px',
};

const text = {
  color: '#3d4760',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '16px',
};

const orderBox = {
  backgroundColor: '#f8f9ff',
  borderRadius: '8px',
  padding: '24px',
  marginTop: '24px',
  marginBottom: '24px',
  border: '1px solid #c8d8f0',
};

const orderText = {
  margin: '0 0 8px 0',
  fontSize: '15px',
  color: '#0a1628',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#0B4DE5',
  borderRadius: '9999px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
