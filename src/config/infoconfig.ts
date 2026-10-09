import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Arbetsytor',
  sections: [
    {
      title: 'Översikt',
      description:
        'Arbetsytorna hanterar dina organisationer — en per kund. Du kan skapa nya, växla mellan dem och bjuda in kollegor. Alla funktioner i appen följer den aktiva arbetsytans paket.',
      links: []
    },
    {
      title: 'Skapa ny arbetsyta',
      description:
        'Klicka på "Skapa organisation" för en ny kund eller avdelning. Den blir aktiv direkt och datan provisioningas automatiskt vid första besöket.',
      links: []
    },
    {
      title: 'Växla arbetsyta',
      description:
        'Klicka på en arbetsyta i listan för att växla — all data är helt separerad mellan arbetsytorna.',
      links: []
    },
    {
      title: 'Team & roller',
      description:
        'Varje arbetsyta har sitt eget team med svenska roller (Utgående samtal, Inkommande samtal, AI Assistent). Admin ger ut rollerna i Team-hanteringen.',
      links: []
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Team-hantering',
  sections: [
    {
      title: 'Medlemmar & roller',
      description:
        'Bjud in kollegor via e-post och ge dem en svensk roll: Utgående samtal (ringkampanjer & prospekt), Inkommande samtal (statistik & historik), AI Assistent — eller kombinationer. Rollen avgör exakt vad medlemmen ser och kan göra.',
      links: []
    },
    {
      title: 'Paketen sätter taket',
      description:
        'Ingen roll kan ge mer än vad organisationen köpt — har ni inte AI Assistenten syns den inte för någon, inte ens admin. Paketen sätts av Talera.',
      links: []
    },
    {
      title: 'Admin',
      description:
        'Admin ser allt som ingår i organisationens paket: Översikt, Ringkampanjer, Kontakter, Realtidsvy, Samtalshistorik samt team- och nummerhantering.',
      links: []
    },
    {
      title: 'Återkalla åtkomst',
      description:
        'Ta bort en medlem så förlorar personen omedelbar åtkomst — inga uppgifter lämnas kvar i databasen.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Billing & Plans',
  sections: [
    {
      title: 'Overview',
      description:
        "The Billing page allows you to manage your organization's subscription and usage limits. Plans and subscriptions are managed through Clerk Billing for B2B, which provides organization-level subscription management with integrated Stripe payment processing.",
      links: [
        {
          title: 'Clerk Billing Documentation',
          url: 'https://clerk.com/docs/billing/overview'
        }
      ]
    },
    {
      title: 'Available Plans',
      description:
        'View and subscribe to available plans through the pricing table. Plans are created and managed in the Clerk Dashboard. Toggle "Publicly available" on plans to show them in the pricing table. Common plans include free, pro, and team tiers.',
      links: [
        {
          title: 'Clerk Dashboard - Plans',
          url: 'https://dashboard.clerk.com/~/billing/plans'
        }
      ]
    },
    {
      title: 'Plan Features',
      description:
        'Each plan can include specific features that unlock functionality in the application. Features are added to plans in the Clerk Dashboard and can be checked in code using the `has()` function with `feature` checks.',
      links: []
    },
    {
      title: 'Access Control',
      description:
        'Plans and features are used for access control throughout the application. Server-side checks use the `has()` function to verify plan or feature access. Client-side protection uses the `<Show>` component to conditionally render content based on subscription status.',
      links: []
    },
    {
      title: 'Billing Cost Structure',
      description:
        "Clerk Billing costs 0.7% per transaction, plus transaction fees paid directly to Stripe. Clerk Billing is not the same as Stripe Billing - plans and pricing are managed through the Clerk Dashboard and won't sync with existing Stripe products. Clerk uses Stripe only for payment processing.",
      links: []
    },
    {
      title: 'Setup Requirements',
      description:
        "To enable billing, navigate to Billing Settings in the Clerk Dashboard and enable billing for your application. Choose between Clerk's development gateway (for testing) or your own Stripe account (for production). Note: A Stripe account created for development cannot be used for production.",
      links: [
        {
          title: 'Billing Settings',
          url: 'https://dashboard.clerk.com/~/billing/settings'
        }
      ]
    },
    {
      title: 'Beta Status',
      description:
        'Billing is currently in Beta and its APIs are experimental and may undergo breaking changes. To mitigate potential disruptions, we recommend pinning your SDK and `clerk-js` package versions.',
      links: []
    }
  ]
};

export const productInfoContent: InfobarContent = {
  title: 'Product Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Products page allows you to manage your product catalog. You can view all products in a table format with server-side functionality including sorting, filtering, pagination, and search capabilities. Use the "Add New" button to create new products.',
      links: [
        {
          title: 'Product Management Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Adding Products',
      description:
        'To add a new product, click the "Add New" button in the page header. You will be taken to a form where you can enter product details including name, description, price, category, and upload product images.',
      links: [
        {
          title: 'Adding Products Documentation',
          url: '#'
        }
      ]
    },
    {
      title: 'Editing Products',
      description:
        'You can edit existing products by clicking on a product row in the table. This will open the product edit form where you can modify any product information. Changes are saved automatically when you submit the form.',
      links: [
        {
          title: 'Editing Products Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Deleting Products',
      description:
        'Products can be deleted from the product listing table. Click the delete action for the product you want to remove. You will be asked to confirm the deletion before the product is permanently removed from your catalog.',
      links: [
        {
          title: 'Product Deletion Policy',
          url: '#'
        }
      ]
    },
    {
      title: 'Table Features',
      description:
        'The product table includes several powerful features to help you manage large product catalogs efficiently. You can sort columns by clicking on column headers, filter products using the filter controls, navigate through pages using pagination, and quickly find products using the search functionality.',
      links: [
        {
          title: 'Table Features Documentation',
          url: '#'
        },
        {
          title: 'Sorting and Filtering Guide',
          url: '#'
        }
      ]
    },
    {
      title: 'Product Fields',
      description:
        'Each product can have the following fields: Name (required), Description (optional text), Price (numeric value), Category (for organizing products), and Image Upload (for product photos). All fields can be edited when creating or updating a product.',
      links: [
        {
          title: 'Product Fields Specification',
          url: '#'
        }
      ]
    }
  ]
};
