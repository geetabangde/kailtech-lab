import dayjs from "dayjs";

export default function ExportToPdfConsentLetter({ data, companyInfo, logoBase64, sigBase64, sealBase64, withLH = true }) {
    if (!data) return null;

    const formattedDate = data.consentletterdate
        ? dayjs(data.consentletterdate).format("DD.MM.YYYY")
        : "";

    const isDraft = data.status === 0 || data.status === "0";

    return (
        <div className="relative mx-auto w-[794px] bg-white text-black font-sans min-h-[1110px] pb-[100px]">
            {/* DRAFT Watermark */}
            {isDraft && (
                <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center opacity-10 select-none">
                    <span className="rotate-[-35deg] text-[150px] font-black tracking-widest text-gray-500 uppercase">
                        DRAFT
                    </span>
                </div>
            )}

            {/* Header: Logo (col-xs-3) + Info (col-xs-9) */}
            {withLH && (
                <div className="flex w-full items-start px-[50px] py-[25px]">
                    <div className="w-1/4">
                        {(logoBase64 || companyInfo?.branding?.logo) ? (
                            <img
                                src={logoBase64 || companyInfo?.branding?.logo}
                                alt="Logo"
                                className="max-h-[95px] object-contain"
                            />
                        ) : null}
                    </div>
                    <div className="w-3/4 text-right">
                        <div className="font-mono text-[13px] italic leading-tight text-gray-600">
                            NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),
                            <br />
                            BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
                        </div>
                        <h2 className="m-0 mt-2 text-2xl font-bold text-[#000080]">
                            {companyInfo?.company?.name || data.company_name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}
                        </h2>
                    </div>
                </div>
            )}

            {/* Document Title (Centered) */}
            {withLH && (
                <div className="mb-4 mt-2 w-full text-center">
                    <h3 className="m-0 inline-block border-b border-gray-200 pb-1 text-[16px] font-bold uppercase tracking-widest text-black">
                        CONSENT LETTER
                    </h3>
                </div>
            )}

            {/* Main Content Area */}
            <div className="relative z-10 px-[50px] pt-4">
                {/* Letter Metadata (Right Aligned) */}
                <div className="mb-8 flex w-full justify-end">
                    <div className="text-right text-[13px] leading-relaxed">
                        <p className="font-bold">{data.conosentletterno}</p>
                        <p>{data.datedon || formattedDate}</p>
                    </div>
                </div>

                {/* Customer Information (Left Aligned) */}
                <div className="mb-10 w-full text-left text-[14px]">
                    <h3 className="m-0 font-bold uppercase text-black">
                        {data.customername}
                    </h3>
                    <p className="m-0 mt-0.5 leading-snug text-gray-700">
                        {data.customeraddress}
                    </p>
                </div>

                {/* Body text */}
                <div className="text-[14px] leading-[1.8] text-black pr-4">
                    <p>Dear Sir,</p>
                    <br />
                    <p>With reference to your email regarding the consent letter.</p>
                    <br />
                    <p className="text-justify">
                        We intimate you that we have fully equipped laboratory for the complete testing as per <strong>{data.standard}</strong> {data.remark}
                    </p>
                    <br />
                    <p className="text-justify">
                        We hereby give consent for complete testing as per <strong>{data.standard}</strong> as and when the sample is provided by you on chargeable basis. {data.remark2}
                    </p>
                    <br />
                    <p>Assuring you of the best services at our end.</p>
                    <p>Please feel free to contact us for any of your query.</p>
                </div>

                {/* Signature Block (Left Aligned) */}
                <div className="mt-16 text-left relative min-h-[120px]">
                    <p className="text-[14px] font-bold text-black mb-1">
                        {companyInfo?.company?.name || data.company_name || "KAILTECH TEST & RESEARCH CENTRE PVT. LTD."}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-left">
                        {sealBase64 && (
                            <img
                                src={sealBase64}
                                alt="Seal"
                                className="w-[80px] object-contain"
                            />
                        )}
                        {sigBase64 ? (
                            <img
                                src={sigBase64}
                                alt="Signature"
                                className="max-h-[110px] object-contain"
                            />
                        ) : (
                            <div className="font-mono text-[12px] leading-tight text-black opacity-90 whitespace-pre-line text-left">
                                <p>Electronically signed by</p>
                                <p>{data.signature_by || data.approved_by_name} {data.signature_emp_id ? `(Emp - ${data.signature_emp_id})` : ""}</p>
                                <p>Designation:{data.signature_designation || "Manager-Accounts"}</p>
                                <p>Date:{data.datedon ? data.datedon : (data.approved_on ? formattedDate : "")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
