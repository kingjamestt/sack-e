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

interface EventReminderProps {
  customerName: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
}

export const EventReminder = ({
  customerName = 'Valued Customer',
  eventName = 'Sack-E',
  eventDate = 'TBA',
  eventLocation = 'TBA',
}: EventReminderProps) => (
  <Html>
    <Head />
    <Preview>Reminder: {eventName} is coming up!</Preview>
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
          <Heading style={title}>Get Ready for {eventName}!</Heading>
          
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            This is a friendly reminder that your upcoming event is almost here. We can't wait to see you there!
          </Text>

          <Section style={orderBox}>
            <Text style={orderText}><strong>Event:</strong> {eventName}</Text>
            <Text style={orderText}><strong>Date &amp; Time:</strong> {eventDate}</Text>
            <Text style={orderText}><strong>Location:</strong> {eventLocation}</Text>
          </Section>

          <Text style={text}>
            <strong>Important:</strong> Your ticket QR code will unlock securely at 12:00 AM on the day of the event. Please ensure you have access to your digital wallet on Sack-E Online to present your ticket at the venue.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://sackie-online.web.app/my-tickets">
              View Your Tickets
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

export default EventReminder;

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
