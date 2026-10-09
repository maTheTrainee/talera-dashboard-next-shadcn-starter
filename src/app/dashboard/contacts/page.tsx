import PageContainer from '@/components/layout/page-container';
import ContactListingPage from '@/features/contacts/components/contact-listing';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';
import { contactsInfoContent } from '@/features/contacts/info-content';
import { ContactFormSheetTrigger } from '@/features/contacts/components/contact-form-sheet';
import { CsvTemplateButton } from '@/components/csv-template-button';

export const metadata = {
  title: 'Dashboard: Kontakter'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ContactsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Kontakter'
      pageDescription='Dina prospekt och deras ringstatus.'
      infoContent={contactsInfoContent}
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <CsvTemplateButton />
          <ContactFormSheetTrigger />
        </div>
      }
    >
      <ContactListingPage />
    </PageContainer>
  );
}
