'use client';

import { useState, useEffect } from 'react';
import { getTeamMembers, inviteTeamMember, removeTeamMember, updateTeamMemberStatus } from '@/lib/team';
import { createNotification } from '@/lib/notifications';
import { TeamMember, TeamRole } from '@/types';
import { Users, Trash2, Mail, Check, X, Link as LinkIcon, CheckSquare, Square } from 'lucide-react';

export default function EventTeamSection({ eventId }: { eventId: string }) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('scanner');
  const [submitting, setSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const data = await getTeamMembers(eventId);
        setTeam(data);
      } catch (err) {
        console.error("Failed to load team members", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setSubmitting(true);
    try {
      await inviteTeamMember(eventId, inviteEmail, inviteRole);
      setTeam([...team, { 
        id: inviteEmail.toLowerCase(), 
        email: inviteEmail.toLowerCase(), 
        role: inviteRole, 
        status: 'pending', 
        createdAt: new Date().toISOString() 
      }]);
      setIsModalOpen(false);
      setInviteEmail('');
      setInviteRole('scanner');
    } catch (err) {
      console.error(err);
      alert('Failed to invite member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string, isDenying = false) => {
    if (isDenying || confirm("Are you sure you want to remove this team member?")) {
      try {
        const member = team.find(m => m.id === memberId);
        await removeTeamMember(eventId, memberId);
        setTeam(team.filter(m => m.id !== memberId));
        if (selectedRequests.has(memberId)) {
          const next = new Set(selectedRequests);
          next.delete(memberId);
          setSelectedRequests(next);
        }
        
        if (isDenying && member?.userId) {
          try {
            await createNotification(member.userId, {
              title: 'Committee Request Declined',
              message: 'Your request to join the committee has been declined by the organizer.',
              type: 'system',
              relatedDocId: eventId
            });
          } catch (e) {
            console.error("Failed to notify user of denial", e);
          }
        }
      } catch (err) {
        console.error("Failed to remove member", err);
      }
    }
  };

  const handleApprove = async (memberId: string) => {
    try {
      await updateTeamMemberStatus(eventId, memberId, 'active');
      setTeam(team.map(m => m.id === memberId ? { ...m, status: 'active' } : m));
      if (selectedRequests.has(memberId)) {
        const next = new Set(selectedRequests);
        next.delete(memberId);
        setSelectedRequests(next);
      }
      
      const member = team.find(m => m.id === memberId);
      if (member?.userId) {
        try {
          await createNotification(member.userId, {
            title: 'Committee Request Approved',
            message: 'Your request to join the committee has been approved! The event is now visible on your dashboard.',
            type: 'system',
            relatedDocId: eventId
          });
        } catch (e) {
          console.error("Failed to notify user of approval", e);
        }
      }
    } catch (err) {
      console.error("Failed to approve member", err);
    }
  };

  const handleBulkApprove = async () => {
    for (const memberId of selectedRequests) {
      await handleApprove(memberId);
    }
    setSelectedRequests(new Set());
  };

  const toggleSelection = (memberId: string) => {
    const next = new Set(selectedRequests);
    if (next.has(memberId)) {
      next.delete(memberId);
    } else {
      next.add(memberId);
    }
    setSelectedRequests(next);
  };

  const toggleAll = () => {
    if (selectedRequests.size === pendingRequests.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map(r => r.id)));
    }
  };

  const handleCopyLink = () => {
    const inviteLink = `${window.location.origin}/invite/${eventId}`;
    navigator.clipboard.writeText(inviteLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return <div className="animate-pulse h-32 bg-surface-container rounded-3xl mt-6"></div>;
  }

  const activeTeam = team.filter(m => m.status !== 'requested');
  const pendingRequests = team.filter(m => m.status === 'requested');

  return (
    <div className="space-y-6 mt-6" id="team">
      
      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="bg-surface-container border border-primary/20 rounded-3xl p-6 shadow-xl shadow-primary/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="font-display text-xl font-bold flex items-center gap-2 text-primary">
              <Users size={20} /> Pending Committee Requests ({pendingRequests.length})
            </h2>
            {selectedRequests.size > 0 && (
              <button 
                onClick={handleBulkApprove}
                className="w-full sm:w-auto text-sm px-4 py-2.5 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary-container transition-colors text-center"
              >
                Approve Selected ({selectedRequests.size})
              </button>
            )}
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-primary/10 text-on-surface-variant text-sm tracking-wider uppercase">
                  <th className="pb-3 w-10">
                    <button onClick={toggleAll} className="text-on-surface-variant hover:text-on-surface transition-colors">
                      {selectedRequests.size === pendingRequests.length && pendingRequests.length > 0 ? <CheckSquare size={18} className="text-primary"/> : <Square size={18}/>}
                    </button>
                  </th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Requested Role</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pendingRequests.map(member => (
                  <tr key={member.id} className="group hover:bg-black/5 transition-colors">
                    <td className="py-4">
                      <button onClick={() => toggleSelection(member.id)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                        {selectedRequests.has(member.id) ? <CheckSquare size={18} className="text-primary"/> : <Square size={18}/>}
                      </button>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-on-surface-variant" />
                        <span className="font-semibold text-on-surface">{member.email}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block bg-secondary/10 text-secondary">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(member.id)}
                          className="text-xs px-3 py-1 bg-success/20 text-success hover:bg-success/30 font-bold rounded transition-colors"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRemove(member.id, true)}
                          className="text-xs px-3 py-1 bg-error/10 text-error hover:bg-error/20 font-bold rounded transition-colors"
                        >
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {pendingRequests.map(member => (
              <div key={member.id} className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button onClick={() => toggleSelection(member.id)} className="flex-shrink-0 text-on-surface-variant hover:text-on-surface transition-colors">
                      {selectedRequests.has(member.id) ? <CheckSquare size={20} className="text-primary"/> : <Square size={20}/>}
                    </button>
                    <span className="font-semibold text-sm break-all truncate">{member.email}</span>
                  </div>
                  <span className="flex-shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block bg-secondary/10 text-secondary">
                    {member.role}
                  </span>
                </div>
                
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-outline-variant/20">
                  <button 
                    onClick={() => handleApprove(member.id)}
                    className="text-xs px-5 py-2.5 bg-success/20 text-success hover:bg-success/30 font-bold rounded-xl transition-colors"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleRemove(member.id, true)}
                    className="text-xs px-5 py-2.5 bg-error/10 text-error hover:bg-error/20 font-bold rounded-xl transition-colors"
                  >
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Team Section */}
      <div className="bg-surface-container border border-black/10 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users size={24} className="text-secondary" /> My Team (Committee)
          </h2>
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
            <button 
              onClick={handleCopyLink}
              className="w-full sm:w-auto text-sm px-4 py-2.5 bg-surface-container-high border border-black/10 text-on-surface font-bold rounded-xl hover:bg-black/5 transition-colors flex items-center justify-center gap-2"
            >
              <LinkIcon size={16} /> {isCopied ? 'Copied!' : 'Copy Invite Link'}
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto text-sm px-4 py-2.5 bg-secondary/20 text-secondary font-bold rounded-xl hover:bg-secondary/30 transition-colors text-center"
            >
              + Invite Member
            </button>
          </div>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 text-on-surface-variant text-sm tracking-wider uppercase">
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTeam.map(member => (
                <tr key={member.id} className="group hover:bg-black/5 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-on-surface-variant" />
                      <span className="font-semibold text-on-surface">{member.email}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block ${member.role === 'admin' ? 'bg-primary/10 text-primary' : member.role === 'owner' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`text-xs ${member.status === 'pending' ? 'text-orange-400' : 'text-green-400'}`}>
                      {member.status === 'pending' ? 'Pending Invite' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {member.role !== 'owner' && (
                      <button 
                        onClick={() => handleRemove(member.id)}
                        className="text-error/70 hover:text-error hover:bg-error/10 p-2 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {activeTeam.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-on-surface-variant">
                    No committee members found. Invite someone to help manage this event!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-4">
          {activeTeam.map(member => (
            <div key={member.id} className="bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {member.email.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold text-sm break-all truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-10">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block ${member.role === 'admin' ? 'bg-primary/10 text-primary' : member.role === 'owner' ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}>
                      {member.role}
                    </span>
                    <span className={`text-xs font-semibold ${member.status === 'pending' ? 'text-orange-500' : 'text-green-600'}`}>
                      {member.status === 'pending' ? 'Pending' : 'Active'}
                    </span>
                  </div>
                </div>
                
                {member.role !== 'owner' && (
                  <button 
                    onClick={() => handleRemove(member.id)}
                    className="flex-shrink-0 text-error hover:bg-error/10 p-2.5 rounded-xl transition-colors mt-1"
                    title="Remove member"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {activeTeam.length === 0 && (
            <p className="py-8 text-center text-sm text-on-surface-variant">
              No committee members found. Invite someone to help manage this event!
            </p>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-surface-container-high border border-black/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-black/10 flex justify-between items-center bg-surface-container">
                <h3 className="font-display text-xl font-bold">Invite Team Member</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-black/20 border border-black/10 rounded-xl p-3 focus:outline-none focus:border-secondary" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Role</label>
                  <select 
                    className="w-full bg-black/20 border border-black/10 rounded-xl p-3 focus:outline-none focus:border-secondary"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value as TeamRole)}
                  >
                    <option value="scanner">Barcode/QR Scanner</option>
                    <option value="admin">Event Admin</option>
                    <option value="committee">Committee Member</option>
                  </select>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {inviteRole === 'scanner' ? 'Scanners can only scan tickets at the door using the mobile view.' : inviteRole === 'admin' ? 'Admins can manage tickets, tiers, and event settings.' : 'Committee Members can approve ticket requests.'}
                  </p>
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 font-bold rounded-xl hover:bg-black/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="px-5 py-2.5 bg-secondary text-on-secondary font-bold rounded-xl hover:bg-secondary-container transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Invite'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
