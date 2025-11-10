import Trips from './pages/Trips';
import Account from './pages/Account';
import Inbox from './pages/Inbox';
import VehicleDetails from './pages/VehicleDetails';
import Admin from './pages/Admin';
import Welcome from './pages/Welcome';
import ContactUs from './pages/ContactUs';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CommunityAgreement from './pages/CommunityAgreement';
import Payout from './pages/Payout';
import Layout from './Layout.jsx';


export const PAGES = {
    "Trips": Trips,
    "Account": Account,
    "Inbox": Inbox,
    "VehicleDetails": VehicleDetails,
    "Admin": Admin,
    "Welcome": Welcome,
    "ContactUs": ContactUs,
    "TermsOfService": TermsOfService,
    "PrivacyPolicy": PrivacyPolicy,
    "CommunityAgreement": CommunityAgreement,
    "Payout": Payout,
}

export const pagesConfig = {
    mainPage: "Trips",
    Pages: PAGES,
    Layout: Layout,
};