# Topsort's Auctions Integration

## What is Topsort?

Topsort is a retail media platform that enables marketplaces and retailers to offer ad placements to their vendors or sellers. It allows vendors to bid for prime advertising spots on the marketplace, boosting their product visibility and driving sales. Topsort simplifies ad management and optimizes ad performance with a self-serve, auction-based system tailored to eCommerce platforms. Check it out [here](https://www.topsort.com)

## Auctions Integration

This app is an implementation of the VTEX search protocol that wraps the VTEX catalog searches related API calls integrated with Topsort's auction.

## How it works?

The store’s search resolver will continue functioning as the standard VTEX search resolver for fetching organic results. However, once these organic results are retrieved, they will be passed to Topsort’s API as part of a request to identify auction winners. The winning sponsored products will then be prioritized and placed at the top of the search results, followed by the organic results, and finally returned to the store.

## Configuration

First, make sure you have created a `Marketplace API Key` in your Topsort's dashboard. Check out how to do it [here](https://api.docs.topsort.com/api-reference/authentication).

It is possible to install in your store either by using App Store or the VTEX IO Toolbelt.

### Using VTEX App Store

1. Access the **Apps** section in your account's admin page and look for the App Store;
2. Search for `Topsort's Auctions Integration`, and open it;
2. Then, click on the **Install** button;
3. You'll see a warning message about needing to enter the necessary configurations. Scroll down and type in your **Topsort API Key** in the `topsortAPIKey` field, and if the available sponsored slots is different than 2, add also the amount on the **Topsort Number of Sponsored Slots** field;
4. Click on **Save**.

### Using VTEX IO Toolbelt

1. [Install](https://developers.vtex.com/docs/guides/vtex-io-documentation-vtex-io-cli-install) VTEX's CLI. You can confirm that the app has now been installed by running `vtex ls` again.
2. Run the command `vtex install topsortpartnercl.auctions@0.x.`
3. Go to the App Settings on VTEX's App Management, add your __Topsort API Key__;
4. Add the __Topsort Number of Sponsored Slots__
5. Click on **Save**.

Now Topsort is listening to your catalog changes on VTEX and integrate it accordingly!

### Next Steps
See how to send your ad [events](https://developers.vtex.com/docs/apps/topsortpartnercl.events)

We’re constantly improving and adding new features to help you get the most out of your retail media efforts. Stay tuned for upcoming updates and enhancements!

Follow us on social media to stay updated:
- [LinkedIn](https://www.linkedin.com/company/topsort)
