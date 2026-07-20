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
  Tailwind,
  Img,
} from '@react-email/components';
import * as React from 'react';

interface TicketTransferProps {
  senderName: string;
  recipientName: string;
  eventName: string;
  eventDate: string;
  ticketCount: number;
}

export const TicketTransfer = ({
  senderName = 'A friend',
  recipientName = 'Valued Customer',
  eventName = 'Sack-E',
  eventDate = 'TBA',
  ticketCount = 1,
}: TicketTransferProps) => (
  <Html>
    <Head />
    <Preview>{senderName} sent you tickets for {eventName}!</Preview>
    <Tailwind>
      <Body className="bg-gray-50 font-sans text-gray-900">
        <Container className="bg-white mx-auto my-12 pb-12 rounded-xl shadow-lg overflow-hidden max-w-[600px]">
          <Section className="bg-[#0B4DE5] px-12 py-8 text-center">
            <Img 
              src="https://sackie-online.web.app/sack-e-logo.jpeg" 
              alt="Sack-E" 
              height="40" 
              style={{ margin: '0 auto' }} 
            />
          </Section>
          
          <Section className="px-12 pt-8">
            <Heading className="text-2xl font-bold text-gray-900 mb-6">
              You've Got Tickets! 🎟️
            </Heading>
            
            <Text className="text-gray-700 text-base leading-relaxed mb-4">
              Hi {recipientName},
            </Text>
            <Text className="text-gray-700 text-base leading-relaxed mb-6">
              Great news! <strong>{senderName}</strong> has transferred {ticketCount} ticket{ticketCount > 1 ? 's' : ''} to you for <strong>{eventName}</strong>.
            </Text>

            <Section className="bg-blue-50 rounded-lg p-6 mb-8 border border-blue-100">
              <Text className="m-0 mb-2 text-sm text-gray-800">
                <strong>Event:</strong> {eventName}
              </Text>
              <Text className="m-0 mb-2 text-sm text-gray-800">
                <strong>Date:</strong> {eventDate}
              </Text>
              <Text className="m-0 text-sm text-gray-800">
                <strong>Tickets:</strong> {ticketCount}
              </Text>
            </Section>

            <Text className="text-gray-700 text-base leading-relaxed mb-8">
              <strong>Important:</strong> For security reasons, QR codes are not emailed. Your tickets have been securely added to your digital wallet. Please log in to your Sack-E Online account to view them.
            </Text>

            <Section className="text-center mb-8">
              <Button 
                href="https://sackie-online.web.app/my-tickets"
                className="bg-[#0B4DE5] text-white rounded-full text-base font-bold text-center px-8 py-4 no-underline inline-block shadow-md hover:bg-blue-700 transition-colors"
              >
                View Your Tickets
              </Button>
            </Section>

            <Hr className="border-gray-200 my-6" />
            
            <Text className="text-gray-500 text-xs leading-relaxed text-center">
              If you did not expect these tickets, please contact support.
              <br /><br />
              © {new Date().getFullYear()} Sack-E Online. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default TicketTransfer;
