import { Suspense } from 'react';
import { ContactsTable, ContactsTableSkeleton } from './contacts-table';

export default function ContactListingPage() {
  // The BFF pattern fetches client-side: the Clerk session cookies can't be
  // forwarded on a server-side prefetch without extra plumbing (deferred to
  // the wiring pass).
  return (
    <Suspense fallback={<ContactsTableSkeleton />}>
      <ContactsTable />
    </Suspense>
  );
}
