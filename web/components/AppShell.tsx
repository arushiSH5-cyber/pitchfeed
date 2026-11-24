"use client";
import { useApp, type View } from "@/lib/store";
import ActivityLog from "./ActivityLog";
import CardStack from "./CardStack";
import CreditModal from "./CreditModal";
import CrewRoom from "./CrewRoom";
import EditSheet from "./EditSheet";
import Insights from "./Insights";
import LeadBrief from "./LeadBrief";
import LeadsTable from "./LeadsTable";
import MapModal from "./MapModal";
import Market from "./Market";
import Network from "./Network";
import Pipeline from "./Pipeline";
import Sidebar from "./Sidebar";
import Signals from "./Signals";
import Topbar from "./Topbar";
import Usage from "./Usage";
import WrappedModal from "./WrappedModal";

const VIEWS: Record<View, React.FC> = {
  feed: () => <><CardStack /><LeadBrief /></>,
  pipeline: Pipeline, leads: LeadsTable, signals: Signals, network: Network, market: Market,
  insights: Insights, activity: ActivityLog, usage: Usage,
};

export default function AppShell() {
  const view = useApp((s) => s.view);
  const V = VIEWS[view];
  return (
    <>
      <section className="screen on" id="app">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="body">
            <div className="views">
              <div className="view on" id={`v-${view}`} key={view}><V /></div>
            </div>
            <CrewRoom />
          </div>
        </div>
      </section>
      <EditSheet />
      <MapModal />
      <CreditModal />
      <WrappedModal />
    </>
  );
}
