import { useState } from "react";
import { PageHeader, Button, StatusBadge, ToastNotification, Modal } from "../shared";
import { UserPlus, Mail, Shield, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

export default function Members() {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // State for the action dropdown menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setIsInviteModalOpen(false);
    setInviteEmail("");
    setToastMessage(`Invitation sent to ${inviteEmail}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAction = (action: string, name: string) => {
    setActiveMenuId(null); // Close the menu
    setToastMessage(`${action} action triggered for ${name}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-serif pb-20 relative">
      
      {/* HEADER */}
      <div className="relative bg-deep text-white w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-luminosity" 
          style={{ maskImage: 'linear-gradient(to left, black, transparent)' }}
        ></div>
        <div className="relative z-10 max-w-[1312px] mx-auto px-8 py-10">
          <PageHeader 
            title="Members" 
            description="Manage your community and access to the library."
            breadcrumbs={[{ label: "Dashboard", to: "/manage" }, { label: "Members" }]}
            actions={<Button variant="secondary" leftIcon={<UserPlus size={16}/>} onClick={() => setIsInviteModalOpen(true)}>Invite Member</Button>}
            tone="dark"
            className="bg-transparent"
          />
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-[1312px] mx-auto px-8 py-10 space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[28px] font-medium text-deep">Active Members</h2>
            <p className="text-muted mt-1">People who currently have access to this library.</p>
          </div>
          <div className="w-72 hidden md:block">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                <input type="text" placeholder="Search members..." className="w-full bg-white border border-line pl-9 pr-4 py-2 rounded-md text-[14px] outline-none focus:border-deep transition-colors" />
             </div>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-white border border-line rounded-lg shadow-sm overflow-visible">
          
          <div className="grid grid-cols-12 gap-4 p-4 bg-mint-soft border-b border-line text-[12px] font-bold uppercase tracking-widest text-muted rounded-t-lg">
            <div className="col-span-6 md:col-span-4">Name</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">Role</div>
            <div className="col-span-3 md:col-span-3 hidden md:block">Status</div>
            <div className="col-span-6 md:col-span-2 text-right">Actions</div>
          </div>

          {/* Admin Row with Dropdown */}
          <div className="relative grid grid-cols-12 gap-4 p-4 items-center border-b border-line hover:bg-gray-50 transition">
            <div className="col-span-6 md:col-span-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-deep text-white flex items-center justify-center text-sm font-bold shrink-0">AI</div>
              <div className="overflow-hidden">
                <p className="font-semibold text-deep truncate">Admin User</p>
                <p className="text-[13px] text-muted truncate">admin@velvetteal.org</p>
              </div>
            </div>
            <div className="col-span-3 hidden md:flex items-center">
              <span className="flex items-center gap-1.5 text-[14px] text-deep font-medium">
                <Shield size={14} className="text-brand" /> Administrator
              </span>
            </div>
            <div className="col-span-3 hidden md:flex items-center">
              <StatusBadge label="Active" variant="success" dot />
            </div>
            
            <div className="col-span-6 md:col-span-2 flex justify-end">
              <button 
                onClick={() => setActiveMenuId(activeMenuId === 'admin' ? null : 'admin')}
                className="p-2 text-muted hover:text-deep hover:bg-mint rounded-md transition"
              >
                <MoreHorizontal size={18} />
              </button>

              {/* DROPDOWN MENU */}
              {activeMenuId === 'admin' && (
                <div className="absolute right-4 top-14 z-20 w-48 bg-white border border-line rounded-lg shadow-xl py-1">
                  <button onClick={() => handleAction("Edit Role", "Admin User")} className="w-full text-left px-4 py-2.5 text-[14px] text-deep hover:bg-mint-soft flex items-center gap-2 transition-colors">
                    <Edit size={14} /> Edit Role
                  </button>
                  <button onClick={() => handleAction("Remove", "Admin User")} className="w-full text-left px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                    <Trash2 size={14} /> Remove Member
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Empty State */}
          <div className="p-12 flex flex-col items-center justify-center text-center bg-[#F8FAFC] rounded-b-lg">
            <div className="bg-mint p-4 rounded-full mb-4">
              <UserPlus size={32} className="text-brand" />
            </div>
            <h3 className="text-xl font-semibold text-deep mb-2">Grow your community</h3>
            <p className="text-muted max-w-sm mb-6">Invite students, staff, or team members to access your library's digital resources.</p>
            <Button leftIcon={<Mail size={16}/>} onClick={() => setIsInviteModalOpen(true)}>Invite via Email</Button>
          </div>

        </div>
      </main>

      {/* INVITE MODAL */}
      <Modal 
        open={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite a Member"
        description="Send an invitation link to a new member via email."
        actions={
          <>
            <Button variant="text" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite}>Send Invitation</Button>
          </>
        }
      >
        <div className="pt-4">
          <label className="block text-[13px] font-semibold uppercase tracking-widest text-muted mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted" />
            <input 
              type="email" 
              placeholder="name@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full border border-line rounded-md pl-10 pr-4 py-2.5 text-[15px] text-deep outline-none focus:border-deep transition-colors"
            />
          </div>
        </div>
      </Modal>

      {/* TOAST NOTIFICATION */}
      <ToastNotification 
        open={!!toastMessage} 
        message={toastMessage || ""} 
        variant="success" 
        placement="top-right"
        onClose={() => setToastMessage(null)} 
      />

    </div>
  );
}