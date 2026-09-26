import { DynamicCmcTable } from './DynamicCmcTable';
import { CtgCmcTable } from './CtgCmcTable';
import { DpgCmcTable } from './DpgCmcTable';
import { MmCmcTable } from './MmCmcTable';
import { OdfmCmcTable } from './OdfmCmcTable';
import { MtCmcTable } from './MtCmcTable';
import { ItCmcTable } from './ItCmcTable';
import { FgCmcTable } from './FgCmcTable';
import { HgCmcTable } from './HgCmcTable';
import { AvgCmcTable } from './AvgCmcTable';
import { MsrCmcTable } from './MsrCmcTable';
import { MgCmcTable } from './MgCmcTable';
import { VcCmcTable } from './VcCmcTable';
import { ExmCmcTable } from './ExmCmcTable';
import { RtdwiCmcTable } from './RtdwiCmcTable';
import { TswoiCmcTable } from './TswoiCmcTable';
import { TswiCmcTable } from './TswiCmcTable';
import { SutmCmcTable } from './SutmCmcTable';
import { PpgCmcTable } from './PpgCmcTable';
import { GtmCmcTable } from './GtmCmcTable';
import { TmCmcTable } from './TmCmcTable';
import { CentCmcTable } from './CentCmcTable';
import { DgCmcTable } from './DgCmcTable';
import { DwCmcTable } from './DwCmcTable';
import { WbCmcTable } from './WbCmcTable';
import { EsCmcTable } from './EsCmcTable';
import { UcCmcTable } from './UcCmcTable';
import { BiomedicalCmcTable } from './BiomedicalCmcTable';
import { WbnCmcTable } from './WbnCmcTable';
import { ThCmcTable } from './ThCmcTable';
import { TsCmcTable } from './TsCmcTable';
import { UtmCmcTable } from './UtmCmcTable';
import { AutmCmcTable } from './AutmCmcTable';
import { VolnlCmcTable } from './VolnlCmcTable';
import { VolCmcTable } from './VolCmcTable';
import { VhtCmcTable } from './VhtCmcTable';
import { StdfCmcTable } from './StdfCmcTable';
import { RhtCmcTable } from './RhtCmcTable';
import { SrfCmcTable } from './SrfCmcTable';

export const CmcTableRenderer = ({ suffix, customLayout, data, electricSafetyData }) => {
  if (customLayout && suffix !== "biomedical") {
    return <DynamicCmcTable customLayout={customLayout} data={data} suffix={suffix} />;
  }

  switch (suffix) {
    case "ctg":
      return <CtgCmcTable data={data} />;
    case "dpg":
      return <DpgCmcTable data={data} />;
    case "mm":
    case "sw":
      return <MmCmcTable data={data} />;
    case "odfm":
      return <OdfmCmcTable data={data} />;
    case "mt":
      return <MtCmcTable data={data} />;
    case "it":
      return <ItCmcTable data={data} />;
    case "fg":
      return <FgCmcTable data={data} />;
    case "hg":
      return <HgCmcTable data={data} />;
    case "avg":
      return <AvgCmcTable data={data} />;
    case "msr":
      return <MsrCmcTable data={data} />;
    case "mg":
      return <MgCmcTable data={data} />;
    case "vc":
      return <VcCmcTable data={data} />;
    case "exm":
      return <ExmCmcTable data={data} />;
    case "rtdwi":
      return <RtdwiCmcTable data={data} />;
    case "tswoi":
      return <TswoiCmcTable data={data} />;
    case "tswi":
      return <TswiCmcTable data={data} />;
    case "sutm":
      return <SutmCmcTable data={data} />;
    case "ppg":
      return <PpgCmcTable data={data} />;
    case "gtm":
      return <GtmCmcTable data={data} />;
    case "tm":
      return <TmCmcTable data={data} />;
    case "cent":
      return <CentCmcTable data={data} />;
    case "dg":
      return <DgCmcTable data={data} />;
    case "dw":
      return <DwCmcTable data={data} />;
    case "wb":
      return <WbCmcTable data={data} />;
    case "es":
      return <EsCmcTable data={data} />;
    case "observationuc":
    case "uc":
      return <UcCmcTable data={data} />;
    case "biomedical":
      return <BiomedicalCmcTable data={data} electricSafetyData={electricSafetyData} />;
    case "wbn":
      return <WbnCmcTable data={data} />;
    case "th":
      return <ThCmcTable data={data} />;
    case "ts":
      return <TsCmcTable data={data} />;
    case "utm":
      return <UtmCmcTable data={data} />;
    case "autm":
      return <AutmCmcTable data={data} />;
    case "volnl":
      return <VolnlCmcTable data={data} />;
    case "vol":
      return <VolCmcTable data={data} />;
    case "vht":
      return <VhtCmcTable data={data} />;
    case "stdf":
    case "observationstdf":
      return <StdfCmcTable data={data} />;
    case "srf":
    case "observationsrf":
      return <SrfCmcTable data={data} />;
    case "rht":
    case "observationrht":
      return <RhtCmcTable data={data} />;
    default:
      return (
        <div className="text-center py-8 text-gray-500">
          No table available for suffix: {suffix}
        </div>
      );
  }
};

export default CmcTableRenderer;
