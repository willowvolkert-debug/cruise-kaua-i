import Account from './pages/Account';
import Admin from './pages/Admin';
import Community from './pages/Community';
import CommunityAgreement from './pages/CommunityAgreement';
import ContactUs from './pages/ContactUs';
import DriverAgreement from './pages/DriverAgreement';
import Home from './pages/Home';
import Inbox from './pages/Inbox';
import Payout from './pages/Payout';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Trips from './pages/Trips';
import Unsubscribe from './pages/Unsubscribe';
import VehicleDetails from './pages/VehicleDetails';
import Welcome from './pages/Welcome';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Account": Account,
    "Admin": Admin,
    "Community": Community,
    "CommunityAgreement": CommunityAgreement,
    "ContactUs": ContactUs,
    "DriverAgreement": DriverAgreement,
    "Home": Home,
    "Inbox": Inbox,
    "Payout": Payout,
    "PrivacyPolicy": PrivacyPolicy,
    "TermsOfService": TermsOfService,
    "Trips": Trips,
    "Unsubscribe": Unsubscribe,
    "VehicleDetails": VehicleDetails,
    "Welcome": Welcome,
}

export const pagesConfig = {
    mainPage: "Trips",
    Pages: PAGES,
    Layout: __Layout,
};