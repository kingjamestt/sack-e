'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { db, storage, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isSaving, setIsSaving] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const [profileData, setProfileData] = useState<any>({
    name: '',
    email: '',
    createdAt: '',
    photoURL: '',
    dob: '',
    gender: 'Male',
    phoneNumber: '',
    emailEvents: true,
    emailNewsletter: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfileData({
            name: data.name || user.displayName || '',
            email: data.email || user.email || '',
            createdAt: data.createdAt || new Date().toISOString(),
            photoURL: data.photoURL || user.photoURL || '',
            dob: data.dob || '',
            gender: data.gender || 'Male',
            phoneNumber: data.phoneNumber || '',
            emailEvents: data.emailEvents !== undefined ? data.emailEvents : true,
            emailNewsletter: data.emailNewsletter !== undefined ? data.emailNewsletter : true,
          });
        }
      }
    }
    fetchProfile();
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsSaving(true);
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      setProfileData((prev: any) => ({ ...prev, photoURL: url }));
      
      // Update firestore immediately for image
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: url
      });
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading image: ", error);
      toast.error("Failed to upload image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: profileData.name,
        dob: profileData.dob,
        gender: profileData.gender,
        phoneNumber: profileData.phoneNumber,
        emailEvents: profileData.emailEvents,
        emailNewsletter: profileData.emailNewsletter,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-screen pt-24 md:pt-32 px-6 flex justify-center items-center">
        <div className="animate-pulse font-semibold tracking-widest uppercase text-on-surface-variant">Loading...</div>
      </main>
    );
  }

  const formattedDate = new Date(profileData.createdAt).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  return (
    <main className="min-h-screen pt-24 md:pt-32 pb-20 px-6 max-w-4xl mx-auto">


      <h1 className="font-display text-4xl font-bold mb-2 text-on-surface">Profile Dashboard</h1>
      <p className="text-on-surface-variant mb-10">Your profile information is displayed below.</p>

      <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        {/* Left Column - Image */}
        <div className="flex flex-col items-center">
          <div className="relative w-64 h-64 rounded-xl overflow-hidden bg-surface-container-high border-2 border-black/10 mb-4 group">
            {profileData.photoURL ? (
              <img src={profileData.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                No Image
              </div>
            )}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera size={32} className="mb-2 text-on-surface" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">Change Photo</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*"
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-64 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors"
          >
            Upload Picture
          </button>
        </div>

        {/* Right Column - Form */}
        <div className="glass rounded-3xl p-6 md:p-8">
          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Email</label>
                <input 
                  type="text" 
                  value={profileData.email} 
                  disabled
                  className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-on-surface-variant cursor-not-allowed"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Registered On</label>
                <input 
                  type="text" 
                  value={formattedDate} 
                  disabled
                  className="w-full bg-surface-container border border-white/5 rounded-xl py-3 px-4 text-on-surface-variant cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Name</label>
              <input 
                type="text" 
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Date of Birth</label>
                <input 
                  type="date" 
                  value={profileData.dob}
                  onChange={(e) => setProfileData({...profileData, dob: e.target.value})}
                  className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Gender</label>
                <select 
                  value={profileData.gender}
                  onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                  className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">Phone</label>
              <input 
                type="tel" 
                value={profileData.phoneNumber}
                onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                placeholder="+1 234 567 8900"
                className="w-full bg-surface-container-high border border-black/10 rounded-xl py-3 px-4 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>

            <div className="pt-4 border-t border-black/10 space-y-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileData.emailEvents}
                  onChange={(e) => setProfileData({...profileData, emailEvents: e.target.checked})}
                  className="w-5 h-5 rounded border-black/10 text-primary focus:ring-primary focus:ring-offset-surface bg-surface-container-high"
                />
                <span className="text-sm font-medium text-on-surface">Email Related Events</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={profileData.emailNewsletter}
                  onChange={(e) => setProfileData({...profileData, emailNewsletter: e.target.checked})}
                  className="w-5 h-5 rounded border-black/10 text-primary focus:ring-primary focus:ring-offset-surface bg-surface-container-high"
                />
                <span className="text-sm font-medium text-on-surface">Email Newsletter</span>
              </label>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center justify-center w-full md:w-auto px-8 py-4 bg-gradient-to-r from-primary to-secondary text-on-primary font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save size={18} className="mr-2" />
                {isSaving ? 'Saving...' : 'Edit Profile'}
              </button>
            </div>
          </form>

          <div className="mt-12 pt-8 border-t border-black/10">
            <h3 className="text-xl font-bold mb-4 font-display">Security</h3>
            <div className="bg-surface-container border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-on-surface mb-1">Change Password</h4>
                  <p className="text-sm text-on-surface-variant">
                    We will send a secure link to your email ({profileData.email}) to reset your password.
                  </p>
                </div>
                <button 
                  onClick={async () => {
                    if (!user?.email) return;
                    try {
                      setResetError('');
                      await sendPasswordResetEmail(auth, user.email);
                      setResetSent(true);
                      setTimeout(() => setResetSent(false), 5000);
                    } catch (err: any) {
                      setResetError(err.message || 'Failed to send reset email.');
                    }
                  }}
                  disabled={resetSent}
                  className="shrink-0 px-6 py-3 bg-surface-container-high hover:bg-black/10 text-on-surface font-bold rounded-xl border border-black/10 transition-colors disabled:opacity-50"
                >
                  {resetSent ? 'Link Sent!' : 'Send Reset Link'}
                </button>
              </div>
              {resetError && <p className="text-error text-sm mt-3 font-semibold">{resetError}</p>}
              {resetSent && <p className="text-success text-sm mt-3 font-semibold">Please check your inbox (and spam folder) for the password reset link.</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
