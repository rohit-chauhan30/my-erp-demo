"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Bot, LayoutDashboard, Users2, Building2, Landmark, CreditCard, Settings, Send, Plus, CheckCircle2, XCircle, ChevronRight, UserCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Toaster } from "../components/ui/sonner";
import { toast } from "sonner";

/**
 * Single-file Multi-Role Property Management ERP — Mock Demo (No DB)
 * - Single component with Role Switcher (Super Admin / Broker / Sales Head / Accounts / Customer)
 * - Implements forms & listings per PDF fields (mocked).
 * - OTP = 123456 (demo). File uploads are mocked. 48-hour rule simulated as 'timerStartedAt' and status badges.
 * - Approve / Discard flows move items between lists to simulate workflow: Broker -> SalesHead -> Accounts -> Approved.
 * - All data in-memory; refresh resets state.
 */

const ROLES = ["Super Admin", "Broker", "Sales Head", "Accounts", "Customer"];

const seeded = {
  brokers: [
    { id: "BRK-1001", name: "Aayush Realty", email: "aayush@realty.com", phone: "9000011111", address: "MG Road", city: "Noida", state: "Uttar Pradesh", zip: "201301", logo: null },
  ],
  customers: [
    { id: "CUS-5001", name: "Riya Verma", email: "riya@example.com", phone: "9890012345", brokerId: "BRK-1001", status: "Pending", verified: false, lastContact: null, timerStartedAt: null, aadhar: null, pan: null, propertyUnit: null },
  ],
  properties: [
    { code: "AK-TWR-1203", name: "Akasa Tower - 1203", type: "3BHK", bsp: 12500000 },
  ],
  bookings: [
    // bookings move from broker->salesHead->accounts
  ],
  transactions: [],
};

export default function MultiRoleERPMock() {
  const [role, setRole] = useState("Super Admin");
  const [brokers, setBrokers] = useState(seeded.brokers);
  const [customers, setCustomers] = useState(seeded.customers);
  const [properties] = useState(seeded.properties);
  const [bookings, setBookings] = useState(seeded.bookings);
  const [transactions, setTransactions] = useState(seeded.transactions);

  // modals & forms
  const [showAddBroker, setShowAddBroker] = useState(false);
  const [brokerForm, setBrokerForm] = useState({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", logo: null });

  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: "", email: "", phone: "", brokerId: "", propertyUnit: "" });

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState<any>(null); // {type: 'customer'|'broker-login'|'customer-application', id}
  const [otpValue, setOtpValue] = useState("");

  const [showBookingView, setShowBookingView] = useState(false);
  const [activeBooking, setActiveBooking] = useState(null);

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonContext, setReasonContext] = useState({ for: "", id: null, callback: null });
  const [reasonText, setReasonText] = useState("");

  // helpers
  const resetAll = () => {
    setBrokers(seeded.brokers);
    setCustomers(seeded.customers);
    setBookings(seeded.bookings);
    setTransactions(seeded.transactions);
    toast("State reset to seeded demo data");
  };

  const stats = useMemo(() => ({
    brokers: brokers.length,
    customers: customers.length,
    properties: properties.length,
    bookings: bookings.length,
    transactions: transactions.length,
  }), [brokers, customers, properties, bookings, transactions]);

  // Add Broker
  const addBroker = () => {
    const id = `BRK-${1000 + brokers.length + 1}`;
    setBrokers([...brokers, { id, ...brokerForm }]);
    setShowAddBroker(false);
    setBrokerForm({ name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", logo: null });
    toast.success("Broker created (mock)");
  };

  // Add Customer (Broker action) -> starts timer when Generate OTP clicked
  const generateOtpForCustomer = (form: any) => {
    // create temp customer record saved but status Pending until OTP verification
    const id = `CUS-${5000 + customers.length + 1}`;
    const timestamp = Date.now();
    const rec = { id, ...form, status: "Pending", verified: false, lastContact: null, timerStartedAt: timestamp, aadhar: null, pan: null };
    setCustomers([...customers, rec]);
    // open OTP modal to simulate sending
    setOtpTarget({ type: 'customer', id });
    setShowOtpModal(true);
    toast.message("OTP generated & sent (mock). Use 123456 to verify.");
  };

  const verifyOtp = () => {
    if (otpValue.trim() === "123456") {
      if (otpTarget?.type === 'customer') {
        setCustomers(customers.map(c => c.id === otpTarget.id ? { ...c, verified: true, status: 'Complete', lastContact: new Date().toISOString() } : c));
        // create a booking placeholder that will be visible to Sales Head
        const cust = customers.find(c => c.id === otpTarget.id) || {};
        const booking = { id: `BKG-${100 + bookings.length + 1}`, customerId: otpTarget.id, customerName: cust.name || otpTarget.id, propertyUnit: customerForm.propertyUnit || properties[0].code, paymentPlan: 'Flexi', paymentMethod: 'Online Transfer', transactionId: null, bsp: properties[0].bsp || 0, status: 'Submitted', forwardedTo: 'Sales Head', createdAt: Date.now() };
        setBookings([...bookings, booking]);
        toast.success("OTP Verified — Customer registered. Booking submitted to Sales Head (mock).");
      } else if (otpTarget?.type === 'broker-login') {
        toast.success("Broker OTP Verified (mock). Redirecting to Broker Dashboard.");
      }
      setShowOtpModal(false);
      setOtpValue("");
      setOtpTarget(null);
    } else {
      toast.error("Invalid OTP. Use 123456 for demo.");
    }
  };

  // Sales Head actions: Approve or Discard
  const salesApprove = (bookingId) => {
    // move booking to Accounts for financial verification
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'Approved by Sales Head', forwardedTo: 'Accounts' } : b));
    toast.success("Booking approved — forwarded to Accounts (mock)");
  };

  const salesDiscard = (bookingId) => {
    const cb = (reason) => {
      // send back to broker with reason
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'Discarded by Sales Head', forwardedTo: 'Broker', reason } : b));
      toast.message(`Booking discarded and returned to Broker (reason: ${reason})`);
    };
    setReasonContext({ for: 'sales-discard', id: bookingId, callback: cb });
    setReasonText("");
    setShowReasonModal(true);
  };

  // Accounts actions: Approve Transaction or Discard
  const accountsApprove = (bookingId) => {
    const b = bookings.find(x => x.id === bookingId);
    // create transaction
    const tx = { id: `TX-${1000 + transactions.length + 1}`, bookingId, customerName: b?.customerName, date: new Date().toISOString(), paymentMethod: b?.paymentMethod || 'Online', transactionId: `TRX-${Math.floor(Math.random()*90000)+10000}`, amount: b?.bsp || 0, status: 'Approved' };
    setTransactions([...transactions, tx]);
    setBookings(bookings.map(x => x.id === bookingId ? { ...x, status: 'Accounts Approved', forwardedTo: 'Completed' } : x));
    toast.success("Transaction approved — pushed to CRM (mock) and Thank You mail sent to Customer (mock)");
  };

  const accountsDiscard = (bookingId) => {
    const cb = (reason) => {
      // move back to Sales Head pending/review
      setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: 'Discarded by Accounts', forwardedTo: 'Sales Head', reason } : b));
      toast.message(`Transaction discarded by Accounts (reason: ${reason})`);
    };
    setReasonContext({ for: 'accounts-discard', id: bookingId, callback: cb });
    setReasonText("");
    setShowReasonModal(true);
  };

  // Reason modal submit
  const submitReason = () => {
    if (reasonContext.callback) reasonContext.callback(reasonText);
    setShowReasonModal(false);
    setReasonContext({ for: '', id: null, callback: null });
    setReasonText("");
  };

  // Reminder action (Broker -> Customer)
  const sendReminder = (customerId) => {
    const msg = prompt('Enter reminder reason/message (demo)');
    if (msg) {
      setCustomers(customers.map(c => c.id === customerId ? { ...c, lastContact: new Date().toISOString() } : c));
      toast.message("Reminder sent (mock)");
    }
  };

  // Utility: human date
  const hDate = (ts) => ts ? new Date(ts).toLocaleString() : '-';

  // UI Sections for each role
  const RoleHeader = ({ title, actions }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex gap-2">{actions}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <Toaster position="top-center" richColors />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center font-bold">ERP</div>
            <div>
              <h1 className="text-xl font-bold">Property Management ERP — Mock Demo</h1>
              <div className="text-sm text-slate-500">Single-file demo • No DB • OTP = 123456</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select className="rounded-md border p-2" value={role} onChange={(e)=>setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <Button onClick={resetAll}>Reset Demo</Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Sidebar quick */}
          <aside className="col-span-12 md:col-span-3 lg:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Quick Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm text-slate-600">Role: <b>{role}</b></div>
                  <div className="text-sm">Brokers: {brokers.length}</div>
                  <div className="text-sm">Customers: {customers.length}</div>
                  <div className="text-sm">Bookings: {bookings.length}</div>
                  <div className="text-sm">Transactions: {transactions.length}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 rounded-2xl">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {role === 'Super Admin' && <Button onClick={()=>setShowAddBroker(true)}>Add Broker</Button>}
                {role === 'Broker' && <Button onClick={()=>setShowAddCustomer(true)}>Add Customer</Button>}
                <Button variant="secondary" onClick={()=>{ setShowOtpModal(true); setOtpTarget({type:'broker-login', id: brokers[0]?.id}); }}>Simulate OTP Login</Button>
              </CardContent>
            </Card>
          </aside>

          <main className="col-span-12 md:col-span-9 lg:col-span-10 space-y-4">
            {/* Dashboard for all roles */}
            <Card className="rounded-2xl">
              <CardContent className="p-4 grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <div className="text-sm text-slate-500">Brokers</div>
                  <div className="text-2xl font-semibold">{stats.brokers}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <div className="text-sm text-slate-500">Customers</div>
                  <div className="text-2xl font-semibold">{stats.customers}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <div className="text-sm text-slate-500">Bookings</div>
                  <div className="text-2xl font-semibold">{stats.bookings}</div>
                </div>
                <div className="p-4 bg-white rounded-2xl shadow-sm">
                  <div className="text-sm text-slate-500">Transactions</div>
                  <div className="text-2xl font-semibold">{stats.transactions}</div>
                </div>
              </CardContent>
            </Card>

            {/* Role-specific panels */}
            {role === 'Super Admin' && (
              <Card className="rounded-2xl">
                <CardContent>
                  <RoleHeader title="Broker Management" actions={<Button onClick={()=>setShowAddBroker(true)}>Add Broker</Button>} />
                  <div className="grid gap-3">
                    {brokers.map(b => (
                      <div key={b.id} className="p-3 bg-white rounded-xl flex items-center gap-3 shadow-sm">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">{b.name?.charAt(0)}</div>
                        <div className="flex-1">
                          <div className="font-medium">{b.name} <span className="text-xs text-slate-400">({b.id})</span></div>
                          <div className="text-xs text-slate-500">{b.email} • {b.phone}</div>
                          <div className="text-xs text-slate-500">{b.address} • {b.city}, {b.state} - {b.zip}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">Edit</Button>
                          <Button size="sm" variant="destructive" onClick={()=>{ setBrokers(brokers.filter(x=>x.id!==b.id)); toast.message('Broker deleted (mock)'); }}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {role === 'Broker' && (
              <>
                <Card className="rounded-2xl">
                  <CardContent>
                    <RoleHeader title="Add / Register Customer" actions={<Button onClick={()=>setShowAddCustomer(true)}>Add Customer</Button>} />
                    <div className="text-sm text-slate-500">When you click Generate OTP, customer is created with status = Pending and timer starts (48h simulated).</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent>
                    <RoleHeader title="Customer Listing" />
                    <div className="grid gap-3">
                      {customers.filter(c => c.brokerId === (brokers[0]?.id)).map(c => (
                        <div key={c.id} className="p-3 bg-white rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">{c.name?.charAt(0)}</div>
                          <div className="flex-1">
                            <div className="font-medium">{c.name} <span className="text-xs text-slate-400">({c.id})</span></div>
                            <div className="text-xs text-slate-500">{c.email} • {c.phone}</div>
                            <div className="text-xs">Status: <Badge>{c.status}</Badge> • Verified: {c.verified ? <Badge variant="default">Yes</Badge> : <Badge variant="secondary">No</Badge>}</div>
                            <div className="text-xs text-slate-400">Last Contacted: {hDate(c.lastContact)} • Timer Start: {hDate(c.timerStartedAt)}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={()=>{ sendReminder(c.id); }}>Reminder</Button>
                            <Button onClick={()=>{ setOtpTarget({type:'customer-application', id: c.id}); setShowOtpModal(true); toast.message('OTP sent for application (mock)'); }}>Application Form</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {role === 'Sales Head' && (
              <Card className="rounded-2xl">
                <CardContent>
                  <RoleHeader title="Booking Listing (Submitted by Brokers)" />
                  <div className="grid gap-3">
                    {bookings.filter(b => b.forwardedTo === 'Sales Head' || b.forwardedTo === 'Accounts' || b.forwardedTo === 'Completed' || b.forwardedTo === 'Broker').map(b => (
                      <div key={b.id} className="p-3 bg-white rounded-xl flex items-center gap-3 shadow-sm">
                        <div className="flex-1">
                          <div className="font-medium">{b.customerName} <span className="text-xs text-slate-400">({b.id})</span></div>
                          <div className="text-xs text-slate-500">Property: {b.propertyUnit} • Plan: {b.paymentPlan} • Method: {b.paymentMethod}</div>
                          <div className="text-xs text-slate-400">Status: {b.status} • Forwarded: {b.forwardedTo}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={()=>{ setActiveBooking(b); setShowBookingView(true); }}>View</Button>
                          {b.forwardedTo === 'Sales Head' && <Button onClick={()=>salesApprove(b.id)}>Approve</Button>}
                          {b.forwardedTo === 'Sales Head' && <Button variant="destructive" onClick={()=>salesDiscard(b.id)}>Discard</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {role === 'Accounts' && (
              <Card className="rounded-2xl">
                <CardContent>
                  <RoleHeader title="Transaction Listing" />
                  <div className="grid gap-3">
                    {bookings.filter(b => b.forwardedTo === 'Accounts' || b.forwardedTo === 'Completed' || b.forwardedTo === 'Sales Head').map(b => (
                      <div key={b.id} className="p-3 bg-white rounded-xl flex items-center gap-3 shadow-sm">
                        <div className="flex-1">
                          <div className="font-medium">{b.customerName} <span className="text-xs text-slate-400">({b.id})</span></div>
                          <div className="text-xs text-slate-500">Property: {b.propertyUnit} • BSP: ₹ {Number(b.bsp).toLocaleString('en-IN')}</div>
                          <div className="text-xs text-slate-400">Status: {b.status} • Forwarded: {b.forwardedTo}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={()=>accountsApprove(b.id)}>Approve</Button>
                          <Button variant="destructive" onClick={()=>accountsDiscard(b.id)}>Discard</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {role === 'Customer' && (
              <>
                <Card className="rounded-2xl">
                  <CardContent>
                    <RoleHeader title="Customer Panel" actions={<Button onClick={()=>{ setShowOtpModal(true); setOtpTarget({type:'customer-login', id: customers[0]?.id}); }}>Simulate OTP Login</Button>} />
                    <div className="text-sm text-slate-500">Use OTP login to view your bookings and payments (demo).</div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl">
                  <CardContent>
                    <RoleHeader title="Booking Details" />
                    <div className="grid gap-3">
                      {bookings.filter(b => b.customerId === customers[0]?.id || b.status?.includes('Accounts Approved')).map(b => (
                        <div key={b.id} className="p-3 bg-white rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="flex-1">
                            <div className="font-medium">{b.customerName} <span className="text-xs text-slate-400">({b.id})</span></div>
                            <div className="text-xs text-slate-500">Property: {b.propertyUnit} • Status: {b.status}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={()=>toast.message('Agreement download (mock)')}>Download Agreement</Button>
                            <Button onClick={()=>toast.message('Pay Online (mock)')}>Pay Online</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

          </main>
        </div>
      </div>

      {/* Add Broker Modal */}
      <Dialog open={showAddBroker} onOpenChange={setShowAddBroker}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add New Broker</DialogTitle>
            <DialogDescription>Fill broker details (mock upload only).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-2">
            <Input placeholder="Name" value={brokerForm.name} onChange={(e)=>setBrokerForm({...brokerForm, name: e.target.value})} />
            <Input placeholder="Email" value={brokerForm.email} onChange={(e)=>setBrokerForm({...brokerForm, email: e.target.value})} />
            <Input placeholder="Phone" value={brokerForm.phone} onChange={(e)=>setBrokerForm({...brokerForm, phone: e.target.value})} />
            <Textarea placeholder="Address" value={brokerForm.address} onChange={(e)=>setBrokerForm({...brokerForm, address: e.target.value})} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="City" value={brokerForm.city} onChange={(e)=>setBrokerForm({...brokerForm, city: e.target.value})} />
              <Input placeholder="State" value={brokerForm.state} onChange={(e)=>setBrokerForm({...brokerForm, state: e.target.value})} />
              <Input placeholder="Zip" value={brokerForm.zip} onChange={(e)=>setBrokerForm({...brokerForm, zip: e.target.value})} />
            </div>
            <input type="file" onChange={(e)=>setBrokerForm({...brokerForm, logo: e.target.files?.[0] || null})} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setShowAddBroker(false)}>Cancel</Button>
            <Button onClick={addBroker}>Create Broker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal (Broker action) */}
      <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Register Customer</DialogTitle>
            <DialogDescription>Broker-led registration. Generate OTP to send to customer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-2">
            <Input placeholder="Full Name" value={customerForm.name} onChange={(e)=>setCustomerForm({...customerForm, name: e.target.value})} />
            <Input placeholder="Email" value={customerForm.email} onChange={(e)=>setCustomerForm({...customerForm, email: e.target.value})} />
            <Input placeholder="Phone" value={customerForm.phone} onChange={(e)=>setCustomerForm({...customerForm, phone: e.target.value})} />
            <select className="w-full rounded-md border p-2" value={customerForm.brokerId} onChange={(e)=>setCustomerForm({...customerForm, brokerId: e.target.value})}>
              <option value="">Select Broker</option>
              {brokers.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
            </select>
            <select className="w-full rounded-md border p-2" value={customerForm.propertyUnit} onChange={(e)=>setCustomerForm({...customerForm, propertyUnit: e.target.value})}>
              <option value="">Select Property Unit</option>
              {properties.map(p => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
            </select>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setShowAddCustomer(false)}>Cancel</Button>
            <Button onClick={()=>{ generateOtpForCustomer(customerForm); setShowAddCustomer(false); setCustomerForm({ name: '', email: '', phone: '', brokerId: '', propertyUnit: '' }); }}>Generate OTP & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>OTP Verification</DialogTitle>
            <DialogDescription>Enter 6-digit OTP (demo: 123456).</DialogDescription>
          </DialogHeader>
          <div className="p-2 flex gap-2">
            <Input placeholder="Enter OTP" value={otpValue} onChange={(e)=>setOtpValue(e.target.value)} maxLength={6} />
            <Button onClick={verifyOtp}>Verify</Button>
            <Button variant="secondary" onClick={()=>{ setOtpValue('123456'); toast.message('Demo OTP prefilled'); }}>Use Demo OTP</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking View */}
      <Dialog open={showBookingView} onOpenChange={setShowBookingView}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {activeBooking ? (
              <div className="space-y-2">
                <div className="font-medium">{activeBooking.customerName} ({activeBooking.id})</div>
                <div>Property: {activeBooking.propertyUnit}</div>
                <div>Plan: {activeBooking.paymentPlan}</div>
                <div>Method: {activeBooking.paymentMethod}</div>
                <div>BSP: ₹ {Number(activeBooking.bsp).toLocaleString('en-IN')}</div>
                <div className="text-sm text-slate-500">Status: {activeBooking.status}</div>
              </div>
            ) : <div>No booking selected</div>}
          </div>
          <DialogFooter>
            <Button onClick={()=>setShowBookingView(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reason Modal */}
      <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter Reason</DialogTitle>
            <DialogDescription>Provide a reason for discard/transfer (mock).</DialogDescription>
          </DialogHeader>
          <div className="p-2">
            <Textarea placeholder="Enter reason..." value={reasonText} onChange={(e)=>setReasonText(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={()=>setShowReasonModal(false)}>Cancel</Button>
            <Button onClick={submitReason}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
