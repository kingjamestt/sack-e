import { QRCodeSVG } from 'qrcode.react';
import { X, Calendar, MapPin, Clock, Send, Lock } from 'lucide-react';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { useState } from 'react';
import { cancelTicketTransfer, transferTicket, acceptTicketTransfer } from '@/lib/tickets';
import { useAuth } from '@/contexts/AuthContext';

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: any; 
  onUpdateTicket?: (updatedTicket: any) => void;
}

/**
 * TicketDetailModal Component
 * 
 * A modal that displays detailed information about a specific ticket.
 * It provides functionality for the user to transfer the ticket to another email
 * or cancel a pending transfer. It displays the event details and QR code if applicable.
 * 
 * @param {Object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {() => void} props.onClose - Callback function triggered to close the modal.
 * @param {any} props.ticket - The ticket object containing details like ID, status, transfer info, etc.
 * @param {(updatedTicket: any) => void} [props.onUpdateTicket] - Optional callback triggered when the ticket state changes (e.g. transfer successful).
 */
export default function TicketDetailModal({ isOpen, onClose, ticket, onUpdateTicket }: TicketDetailModalProps) {
  const [transferEmail, setTransferEmail] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const { user } = useAuth();

  const handleCancelTransfer = async () => {
    setIsCancelling(true);
    setTransferError('');
    try {
      await cancelTicketTransfer(ticket.id);
      setTransferSuccess(false);
      onUpdateTicket?.({ ...ticket, transfer_pending_to: null });
      setTransferEmail('');
    } catch (err: any) {
      setTransferError(err.message || 'Failed to cancel transfer');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!isOpen || !ticket) return null;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setIsTransferring(true);

    try {
      const updatedEmail = transferEmail.toLowerCase().trim();
      await transferTicket(ticket.id, ticket.status, ticket.eventDetails?.status, updatedEmail);
      
      setTransferSuccess(true);
      onUpdateTicket?.({ ...ticket, transfer_pending_to: updatedEmail });
    } catch (err: any) {
      setTransferError(err.message || 'Failed to transfer ticket');
    } finally {
      setIsTransferring(false);
    }
  };

  const transferLink = ticket.transfer_pending_to 
    ? `${window.location.origin}/my-tickets/transfer/${ticket.id}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transferLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleAcceptTransfer = async () => {
    if (!user || !user.email) return;
    setIsAccepting(true);
    setTransferError('');
    try {
      await acceptTicketTransfer(ticket.id, user.uid, user.email);
      onUpdateTicket?.({ ...ticket, owner_id: user.uid, transfer_pending_to: null });
    } catch (err: any) {
      setTransferError(err.message || 'Failed to accept transfer');
    } finally {
      setIsAccepting(false);
    }
  };

  const isRecipient = user?.email && ticket?.transfer_pending_to === user.email.toLowerCase();
  const isOwner = user?.uid === ticket?.owner_id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
      <div className="bg-surface-container-high border border-black/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-black/10">
          <h2 className="font-display font-bold text-2xl">Ticket Details</h2>
          <button onClick={onClose} className="p-2 bg-black/5 hover:bg-black/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex justify-center">
            {ticket.status === 'scanned' || ticket.status === 'used' ? (
              <span className="px-4 py-1.5 bg-error/20 text-error rounded-full text-sm font-bold uppercase tracking-widest border border-error/50 shadow-[0_0_20px_rgba(255,0,0,0.2)]">
                Already Scanned
              </span>
            ) : (
              <span className="px-4 py-1.5 bg-success/20 text-success rounded-full text-sm font-bold uppercase tracking-widest border border-success/50 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
                Valid Ticket
              </span>
            )}
          </div>

          {/* QR Code */}
          {ticket.eventDetails?.date && isBefore(new Date(), startOfDay(parseISO(ticket.eventDetails.date))) ? (
            <div className="bg-surface-container-high border border-outline-variant/30 p-10 rounded-2xl mx-auto w-max flex flex-col items-center justify-center gap-3 w-[268px] h-[268px]">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-on-surface-variant">
                <Lock size={32} />
              </div>
              <p className="text-center text-sm text-on-surface-variant font-medium mt-2 px-4 leading-relaxed">
                Your QR code will unlock securely on<br/>
                <strong className="text-on-surface">{format(parseISO(ticket.eventDetails.date), 'MMM do, yyyy')}</strong>
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl mx-auto w-max shadow-inner border border-black/5">
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/verify/${ticket.eventId}/${ticket.id}?owner=${ticket.owner_id}`} 
                size={220} 
                bgColor="#ffffff" 
                fgColor="#000000" 
                level="M" 
                includeMargin={false}
              />
            </div>
          )}
          
          <p className="text-center text-xs text-on-surface-variant font-mono uppercase tracking-widest mt-3">
            ID: {ticket.id}
          </p>

          {/* Event Info */}
          <div className="bg-surface-container p-5 rounded-2xl border border-white/5 space-y-3">
            <h3 className="font-bold text-xl mb-4 leading-tight">{ticket.eventDetails?.title}</h3>
            
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Calendar size={16} />
              </div>
              <span>{ticket.eventDetails ? format(parseISO(ticket.eventDetails.date), 'EEEE, MMMM do, yyyy') : 'TBA'}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Clock size={16} />
              </div>
              <span>{ticket.eventDetails?.time || (ticket.eventDetails?.date ? format(parseISO(ticket.eventDetails.date), 'h:mm a') : 'TBA')}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-on-surface-variant">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MapPin size={16} />
              </div>
              <span>{ticket.eventDetails?.location || 'TBA'}</span>
            </div>
          </div>

          {/* Ticket Tier Info */}
          <div className="bg-surface-container p-5 rounded-2xl border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Ticket Tier</p>
              <p className="font-bold text-lg">{ticket.name || 'General Admission'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1">Admit</p>
              <p className="font-mono font-bold text-lg bg-black/5 px-3 py-1 rounded-lg inline-block">1</p>
            </div>
          </div>

          {/* Transfer Section */}
          {ticket.status !== 'scanned' && ticket.status !== 'used' && isOwner && (
            <div className="bg-surface-container p-5 rounded-2xl border border-primary/20 space-y-4">
              <h4 className="font-bold text-lg flex items-center gap-2">
                <Send size={18} className="text-primary" /> Transfer Ticket
              </h4>
              
              {transferSuccess || ticket.transfer_pending_to ? (
                <div className="space-y-4">
                  <div className="p-4 bg-success/10 text-success rounded-xl border border-success/20 text-sm">
                    Transfer initiated for <strong>{ticket.transfer_pending_to || transferEmail}</strong>. 
                    <br/><br/>
                    <strong>⚠️ Important:</strong> You must send them the secure link below. They will need to log in with that email to accept it.
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1 uppercase tracking-wider font-bold">Transfer Link</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        readOnly 
                        value={transferLink} 
                        className="w-full bg-black/20 border border-black/10 rounded-lg px-3 py-2 text-sm outline-none font-mono text-on-surface-variant"
                      />
                      <button 
                        onClick={handleCopy}
                        className="px-4 py-2 bg-primary/20 text-primary font-bold rounded-lg hover:bg-primary/30 transition-colors text-sm shrink-0"
                      >
                        {isCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={handleCancelTransfer}
                    disabled={isCancelling}
                    className="w-full mt-2 py-2.5 bg-error/10 hover:bg-error/20 text-error font-semibold rounded-xl border border-error/20 transition-all text-xs flex items-center justify-center gap-2"
                  >
                    {isCancelling ? 'Cancelling...' : 'Cancel Pending Transfer'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleTransfer} className="space-y-3">
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Enter the recipient&apos;s email to generate a secure transfer link. You will need to share this link with them.
                  </p>
                  {transferError && <p className="text-error text-sm">{transferError}</p>}
                  <div className="flex gap-2">
                    <input 
                      type="email" 
                      placeholder="Friend's email" 
                      required
                      value={transferEmail}
                      onChange={(e) => setTransferEmail(e.target.value)}
                      className="w-full bg-black/20 border border-black/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={isTransferring}
                      className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isTransferring ? '...' : 'Generate Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Accept Transfer Section */}
          {ticket.status !== 'scanned' && ticket.status !== 'used' && isRecipient && (
            <div className="bg-surface-container p-5 rounded-2xl border border-success/40 space-y-4 shadow-[0_0_20px_rgba(0,255,0,0.1)]">
              <h4 className="font-bold text-lg flex items-center gap-2 text-success">
                Pending Transfer to You
              </h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                This ticket has been sent to your email. Accept it to add it to your account permanently.
              </p>
              {transferError && <p className="text-error text-sm">{transferError}</p>}
              <button 
                onClick={handleAcceptTransfer}
                disabled={isAccepting}
                className="w-full py-3 bg-success text-black font-bold rounded-xl hover:bg-success/90 transition-colors disabled:opacity-50"
              >
                {isAccepting ? 'Accepting...' : 'Accept Ticket'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
