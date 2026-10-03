import type { InfobarContent } from '@/components/ui/infobar';

export const workspacesInfoContent: InfobarContent = {
  title: 'Workspaces Management',
  sections: [
    {
      title: 'Overview',
      description:
        'The Workspaces page allows you to manage your workspaces and switch between them. This feature is powered by Clerk Organizations, which enables multi-tenant workspace management. You can view all available workspaces, create new ones, and switch your active workspace.',
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Creating Workspaces',
      description:
        'To create a new workspace, click the "Create Organization" button. You will be prompted to enter a workspace name and configure initial settings. Once created, you can switch to the new workspace and start managing it.',
      links: [
        {
          title: 'Multi-tenant Authentication Guide',
          url: 'https://clerk.com/blog/how-to-build-multitenant-authentication-with-clerk'
        }
      ]
    },
    {
      title: 'Switching Workspaces',
      description:
        'You can switch between workspaces by clicking on a workspace in the list. The selected workspace becomes your active organization context, and all organization-specific features will use this workspace.',
      links: []
    },
    {
      title: 'Workspace Features',
      description:
        'Each workspace operates independently with its own team members, roles, permissions, and billing. This allows you to manage multiple projects or teams within a single account while keeping their data and settings separate.',
      links: []
    },
    {
      title: 'Server-Side Permission Checks',
      description:
        "This application follows Clerk's recommended patterns for multi-tenant authentication. Server-side permission checks ensure that users can only access resources for their active organization.",
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    }
  ]
};

export const teamInfoContent: InfobarContent = {
  title: 'Team Management',
  sections: [
    {
      title: 'Overview',
      description:
        "The Team Management page allows you to manage your workspace team, including members, roles, security settings, and more. This page provides comprehensive organization management through Clerk's OrganizationProfile component.",
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Managing Team Members',
      description:
        'You can add, remove, and manage team members from this page. Invite new members by email, assign roles, and control their access levels. Each member can have different permissions based on their role.',
      links: []
    },
    {
      title: 'Roles and Permissions',
      description:
        'Configure default roles and permissions in the Clerk Dashboard under Organizations settings. Roles define what actions team members can perform within the workspace. Common roles include admin, member, and custom roles you define.',
      links: [
        {
          title: 'Clerk Organizations Documentation',
          url: 'https://clerk.com/docs/organizations/overview'
        }
      ]
    },
    {
      title: 'Security Settings',
      description:
        "Manage security settings for your workspace, including authentication requirements, session management, and access controls. These settings help protect your organization's data and resources.",
      links: []
    },
    {
      title: 'Organization Settings',
      description:
        'Configure general organization settings such as name, logo, and other workspace preferences. These settings apply to the entire workspace and affect all team members.',
      links: []
    },
    {
      title: 'Navigation RBAC System',
      description:
        'The application includes a fully client-side navigation filtering system using the `useNav` hook. It supports `requireOrg`, `permission`, and `role` checks for instant access control. Navigation items are configured in `src/config/nav-config.ts` with `access` properties.',
      links: []
    }
  ]
};

export const billingInfoContent: InfobarContent = {
  title: 'Fakturering & Saldo',
  sections: [
    {
      title: 'Översikt',
      description:
        'Här hanterar du din organisations prenumeration och minuttessaldo för Voice AI-samtal. Prenumerationer hanteras via Clerk Billing med integrerad Stripe-betalning. Ditt saldo uppdateras i realtid när samtal genomförs via n8n-backend.',
      links: [
        {
          title: 'Clerk Billing Dokumentation',
          url: 'https://clerk.com/docs/billing/overview'
        }
      ]
    },
    {
      title: 'Tillgängliga Planer',
      description:
        'Välj en plan som passar era behov. Planer skapas och hanteras i Clerk Dashboard. Aktivera "Publicly available" för att visa dem i pristabellen. Vanliga nivåer: Gratis, Pro, Enterprise.',
      links: [
        {
          title: 'Clerk Dashboard - Planer',
          url: 'https://dashboard.clerk.com/~/billing/plans'
        }
      ]
    },
    {
      title: 'Plan-funktioner',
      description:
        'Varje plan kan innehålla specifika funktioner som låser upp funktionalitet i appen. Funktioner läggs till i planer i Clerk Dashboard och kan kontrolleras med `has()` med `feature`-checks.',
      links: []
    },
    {
      title: 'Minuttessaldo',
      description:
        'För utgående kampanjer dras minuter från ert saldo per genomfört samtal. Saldo syns i realtid på Översikt-sidan. Inkommande samtal (Support AI) räknas separat och påverkar inte utgående saldo.',
      links: []
    },
    {
      title: 'Kostnadsstruktur',
      description:
        'Clerk Billing tar 0,7% per transaktion plus Stripe-avgifter. Clerk Billing är inte samma sak som Stripe Billing - planer och priser hanteras i Clerk Dashboard och synkas inte med befintliga Stripe-produkter.',
      links: []
    },
    {
      title: 'Krav för Aktivering',
      description:
        'Gå till Billing Settings i Clerk Dashboard och aktivera fakturering. Välj mellan Clerks utvecklings-gateway (test) eller ert eget Stripe-konto (produktion). Obs: Ett Stripe-konto för utveckling kan inte användas för produktion.',
      links: [
        {
          title: 'Faktureringsinställningar',
          url: 'https://dashboard.clerk.com/~/billing/settings'
        }
      ]
    },
    {
      title: 'Beta-status',
      description:
        'Fakturering är i Beta och API:er kan genomgå brytande förändringar. Vi rekommenderar att ni pinnar SDK- och `clerk-js`-versioner.',
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
