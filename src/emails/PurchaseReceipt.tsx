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

interface PurchaseReceiptProps {
  customerName: string;
  eventName: string;
  eventDate: string;
  orderId: string;
  totalAmount: string;
  ticketCount: number;
}

export const PurchaseReceipt = ({
  customerName = 'Valued Customer',
  eventName = 'Sack-E',
  eventDate = 'TBA',
  orderId = 'ORD-00000',
  totalAmount = '$0.00',
  ticketCount = 1,
}: PurchaseReceiptProps) => (
  <Html>
    <Head />
    <Preview>Your receipt for {eventName}</Preview>
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
          <Heading style={title}>You're Going to {eventName}!</Heading>
          
          <Text style={text}>Hi {customerName},</Text>
          <Text style={text}>
            Thank you for your purchase. We are thrilled to have you! Your tickets have been securely added to your digital wallet on Sack-E Online.
          </Text>

          <Section style={orderBox}>
            <Text style={orderText}><strong>Order ID:</strong> {orderId}</Text>
            <Text style={orderText}><strong>Event Date:</strong> {eventDate}</Text>
            <Text style={orderText}><strong>Tickets:</strong> {ticketCount}</Text>
            <Text style={orderText}><strong>Total:</strong> {totalAmount}</Text>
          </Section>

          <Text style={text}>
            <strong>Important:</strong> For security reasons, QR codes are not emailed. To protect against fraud, your ticket QR code will remain securely locked in your digital wallet on the platform.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href="https://sackie-online.web.app/my-tickets">
              View Your Tickets
            </Button>
          </Section>

          <Hr style={hr} />
          
          <Text style={footer}>
            If you have any questions about your order, reply to this email or contact support.
            <br /><br />
            © {new Date().getFullYear()} Sack-E Online. All rights reserved.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PurchaseReceipt;

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
