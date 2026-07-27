

// Number to words helper
function numberToWords(n) {
    if (n === 0) return "zero";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const numToWords = (num) => {
        let str = "";
        if (num > 99) {
            str += ones[Math.floor(num / 100)] + " Hundred ";
            num %= 100;
        }
        if (num > 19) {
            str += tens[Math.floor(num / 10)] + " ";
            num %= 10;
        }
        if (num > 0) {
            str += ones[num] + " ";
        }
        return str.trim();
    };
    let words = "";
    if (n > 9999999) {
        words += numToWords(Math.floor(n / 10000000)) + " Crore ";
        n %= 10000000;
    }
    if (n > 99999) {
        words += numToWords(Math.floor(n / 100000)) + " Lakh ";
        n %= 100000;
    }
    if (n > 999) {
        words += numToWords(Math.floor(n / 1000)) + " Thousand ";
        n %= 1000;
    }
    if (n > 0) {
        words += numToWords(n);
    }
    return words.trim();
}

const s = {
    table: { width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "sans-serif", marginBottom: 15 },
    th: { border: "1px solid #000", padding: "4px", backgroundColor: "#f9f9f9", fontWeight: "bold" },
    td: { border: "1px solid #000", padding: "4px", verticalAlign: "top" },
    tR: { textAlign: "right" },
    tC: { textAlign: "center" },
    tL: { textAlign: "left" },
    bold: { fontWeight: "bold" },
};

const f2 = (v) => parseFloat(v || 0).toFixed(2);

const gstStateMap = {
    "01": "JAMMU AND KASHMIR", "02": "HIMACHAL PRADESH", "03": "PUNJAB", "04": "CHANDIGARH", "05": "UTTARAKHAND",
    "06": "HARYANA", "07": "DELHI", "08": "RAJASTHAN", "09": "UTTAR PRADESH", 10: "BIHAR", 11: "SIKKIM",
    12: "ARUNACHAL PRADESH", 13: "NAGALAND", 14: "MANIPUR", 15: "MIZORAM", 16: "TRIPURA", 17: "MEGHALAYA",
    18: "ASSAM", 19: "WEST BENGAL", 20: "JHARKHAND", 21: "ODISHA", 22: "CHHATTISGARH", 23: "MADHYA PRADESH",
    24: "GUJARAT", 27: "MAHARASHTRA", 29: "KARNATAKA", 32: "KERALA", 33: "TAMIL NADU", 36: "TELANGANA",
    37: "ANDHRA PRADESH",
};

export default function ExportCreditNoteToPdf({ data, companyInfo, logoBase64, withLH = true }) {
    if (!data) return null;

    let stCode = String(data.statecode || "");
    if (data.gstno && data.gstno.length === 15 && data.gstno !== "URP") {
        const gstState = data.gstno.substring(0, 2);
        if (!isNaN(gstState)) {
            stCode = gstState;
        }
    }
    if (!isNaN(stCode) && stCode !== "") {
        stCode = stCode.padStart(2, "0");
    }

    const stateName = gstStateMap[stCode] || gstStateMap[Number(stCode)] || data.statename || stCode || "NA";
    const isSGST = stCode === "23";
    const status = Number(data.status);

    const safeQrUrl = data.qr_code_url || (data.signed_qr_code ? `data:image/png;base64,${data.signed_qr_code}` : null);

    const HeaderSection = () => (
        <>
            {/* Letterhead */}
            {withLH && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", marginBottom: 8 }}>
                    <img src={logoBase64} alt="Logo" style={{ height: 60, width: "auto", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontFamily: "serif", fontSize: 11, fontStyle: "italic", color: "#555", margin: 0, textAlign: "right" }}>
                            NABL Accredited as per IS/ISO/IEC 17025 (Certificate Nos. TC-7832 &amp; CC-2348),<br />
                            BIS Recognized &amp; ISO 9001 Certified Test &amp; Calibration Laboratory
                        </p>
                        <div style={{ fontSize: 20, fontWeight: "bold", color: "navy", textAlign: "left", marginTop: 8, paddingLeft: 12 }}>
                            {data.companyname || companyInfo?.company?.name || "KAILTECH TEST AND RESEARCH CENTRE PVT. LTD."}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ textAlign: "center", marginBottom: 8, marginTop: withLH ? 20 : 80 }}>
                <div style={{ fontSize: 14, fontWeight: "bold", textTransform: "uppercase" }}>CREDIT NOTE</div>
            </div>
        </>
    );

    const FooterSection = () => (
        <div style={{ textAlign: "center", fontSize: 11, paddingTop: 8, borderTop: "1px solid #000", marginTop: "auto" }}>
            <div style={{ fontWeight: "bold" }}>
                Plot No.141 C, Electronic Complex, Pardeshipura, Indore-452010 (INDIA) Ph. +91-4787555 (30 Lines), 4046055,4048055
            </div>
            <div>
                Email : contact@kailtech.net,calibration@kailtech.net, Web: www.kailtech.net, CIN-U73100MP2006PTC019006
            </div>
        </div>
    );

    return (
        <div style={{ fontFamily: "Arial,Helvetica,sans-serif", fontSize: 13, color: "#111", backgroundColor: "#fff", padding: "16px 20px", width: "100%" }}>
            {/* Page 1 wrapper: flex column so footer sticks to bottom */}
            <div style={{ display: "flex", flexDirection: "column", minHeight: "257mm" }}>
                <div style={{ flex: 1 }}>
                    <HeaderSection />

                    {/* Customer + Invoice meta */}
                    <table style={s.table}>
                        <colgroup>
                            <col style={{ width: status === 2 && safeQrUrl ? "45%" : "60%" }} />
                            <col style={{ width: status === 2 && safeQrUrl ? "30%" : "40%" }} />
                            {status === 2 && safeQrUrl && <col style={{ width: "25%" }} />}
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style={{ ...s.td, verticalAlign: "top" }}>
                                    <div style={s.bold}>Customer:</div>
                                    <strong>M / s . {data.customername}</strong><br />
                                    <div style={{ marginTop: 4 }}>
                                        {data.address && <div>{data.address}{data.city && `, ${data.city}`}{data.pincode && `, ${data.pincode}`}</div>}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "12px", rowGap: "4px", marginTop: 4 }}>
                                        <div style={{ minWidth: "45%" }}><span style={s.bold}>State name : </span>{stateName}</div>
                                        <div style={{ minWidth: "40%" }}><span style={s.bold}>State code : </span>{stCode || "NA"}</div>
                                        <div style={{ minWidth: "45%" }}><span style={s.bold}>GSTIN/UIN : </span>{data.gstno}</div>
                                        <div style={{ minWidth: "40%" }}><span style={s.bold}>PAN : </span>{data.pan}</div>
                                    </div>
                                </td>
                                <td style={{ ...s.td, verticalAlign: "top" }}>
                                    <div><span style={s.bold}>Credit Note No. : </span>{data.creditnoteno}</div>
                                    <div style={{ marginTop: 4 }}><span style={s.bold}>Date : </span>{data.creditnotedate ? new Date(data.creditnotedate).toLocaleDateString("en-IN") : ""}</div>
                                    <div style={{ marginTop: 4 }}><span style={s.bold}>Invoice No./ Date : </span>{data.invoiceno}</div>
                                </td>
                                {status === 2 && safeQrUrl && (
                                    <td style={{ ...s.td, verticalAlign: "middle", textAlign: "center", padding: 2 }}>
                                        <img src={safeQrUrl} alt="QR Code" style={{ width: "100%", maxWidth: 180, margin: "0 auto" }} />
                                    </td>
                                )}
                            </tr>
                        </tbody>
                    </table>

                    {/* ITEMS LIST */}
                    <table style={s.table}>
                        <colgroup>
                            <col style={{ width: "8%" }} />
                            <col style={{ width: data.potype === "Normal" ? "52%" : "80%" }} />
                            <col style={{ width: "10%" }} />
                            {data.potype === "Normal" && <>
                                <col style={{ width: "15%" }} />
                                <col style={{ width: "15%" }} />
                            </>}
                        </colgroup>
                        <thead>
                            <tr>
                                <th style={s.th}>S. No.</th>
                                <th style={s.th}>Description</th>
                                <th style={s.th}>No&apos;s</th>
                                {data.potype === "Normal" && <th style={s.th}>Rate</th>}
                                {data.potype === "Normal" && <th style={s.th}>Amount</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {(data.items || []).map((item, idx) => (
                                <tr key={idx}>
                                    <td style={{ ...s.td, ...s.tC }}>{idx + 1}</td>
                                    <td style={s.td} dangerouslySetInnerHTML={{ __html: item.description }}></td>
                                    <td style={{ ...s.td, ...s.tC }}>{item.qty || item.quantity || 1}</td>
                                    {data.potype === "Normal" && <td style={{ ...s.td, ...s.tC }}>{item.rate}</td>}
                                    {data.potype === "Normal" && <td style={{ ...s.td, ...s.tR }}>{f2(item.base_amount ?? item.amount)}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* TOTALS AND REMARKS */}
                    <table style={s.table}>
                        <tbody>
                            <tr>
                                <td style={{ ...s.td, width: "60%", wordBreak: "normal" }}>
                                    {status === 2 && (
                                        <div style={{ marginBottom: 10 }}>
                                            <div style={{ wordBreak: "break-all" }}><span style={s.bold}>IRN No:</span> {data.irn}</div>
                                            <div><span style={s.bold}>Acknowledgment No:</span> {data.ack_no}</div>
                                            <div><span style={s.bold}>Acknowledgement Date:</span> {data.ack_dt}</div>
                                        </div>
                                    )}
                                    {data.brnnos && <div style={{ marginBottom: 5, wordBreak: "break-word" }}><span style={s.bold}>BRN No :</span> {data.brnnos.split(',').join(', ')}</div>}
                                    {data.remark && <div style={{ marginBottom: 5 }}><span style={s.bold}>Remark :</span> {data.remark}</div>}
                                    <div style={{ marginTop: 10, lineHeight: 1.4 }}>
                                        PAN : {companyInfo?.company?.pan_no || data.pan || "AADCK0799A"}<br />
                                        GSTIN : {companyInfo?.company?.gst_no || data.gstno || "23AADCK0799A1ZV"}<br />
                                        SAC Code : 998394 Category : Scientific and Technical Consultancy Services<br />
                                        Udhyam Registration No. Type of MSME : 230262102537<br />
                                        CIN NO.U73100MP2006PTC019006
                                    </div>
                                </td>
                                <td style={{ ...s.td, width: "40%", padding: 0 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", border: "none" }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Subtotal</span></td>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.subtotal)}</td>
                                            </tr>
                                            {data.discnumber > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Discount ({data.discnumber}{data.disctype === "%" ? "%" : ""})</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.discount)}</td>
                                                </tr>
                                            )}
                                            {data.witnesscharges > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Witness Charges</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.witnesscharges)}</td>
                                                </tr>
                                            )}
                                            {data.samplehandling > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Sample Handling</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.samplehandling)}</td>
                                                </tr>
                                            )}
                                            {data.sampleprep > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Sample Prep</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.sampleprep)}</td>
                                                </tr>
                                            )}
                                            {data.freight > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Freight</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.freight)}</td>
                                                </tr>
                                            )}
                                            {data.mobilisation > 0 && (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>Mobilization</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.mobilisation)}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Total</span></td>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.subtotal2)}</td>
                                            </tr>
                                            {isSGST ? (
                                                <>
                                                    <tr>
                                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>CGST {data.cgstper}%</td>
                                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.cgstamount)}</td>
                                                    </tr>
                                                    <tr>
                                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>SGST {data.sgstper}%</td>
                                                        <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.sgstamount)}</td>
                                                    </tr>
                                                </>
                                            ) : (
                                                <tr>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}>IGST {data.igstper}%</td>
                                                    <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.igstamount)}</td>
                                                </tr>
                                            )}
                                            <tr>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd" }}><span style={s.bold}>Total w/ Tax</span></td>
                                                <td style={{ padding: "4px 8px", borderBottom: "1px solid #ddd", ...s.tR }}>{f2(data.total)}</td>
                                            </tr>
                                            <tr>
                                                <td style={{ padding: "4px 8px" }}>Round off</td>
                                                <td style={{ padding: "4px 8px", ...s.tR }}>{f2(data.roundoff)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>

                            {/* FINAL ROW */}
                            <tr>
                                <td style={{ ...s.td, width: "60%" }}>
                                    (IN WORDS): Rs. {numberToWords(Math.round(data.finaltotal || 0))} Only
                                </td>
                                <td style={{ ...s.td, width: "40%", padding: 0 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", border: "none", height: "100%" }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ padding: "4px 8px" }}><span style={s.bold}>Total Credit Note</span></td>
                                                <td style={{ padding: "4px 8px", ...s.tR }}>{f2(Math.round(data.finaltotal || 0))}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>{/* end flex:1 */}
                <FooterSection />
            </div>{/* end page 1 wrapper */}

            {/* Page 2: Bank + Signatory + Terms */}
            <div style={{ pageBreakBefore: "always", paddingTop: 10, display: "flex", flexDirection: "column", minHeight: "270mm" }}>
                <div style={{ flex: 1 }}>
                    <HeaderSection />

                    <table style={s.table}>
                        <colgroup>
                            <col style={{ width: "50%" }} />
                            <col style={{ width: "50%" }} />
                        </colgroup>
                        <tbody>
                            <tr>
                                <td style={{ verticalAlign: "top", padding: "10px" }}>
                                    <div>For online payments - {data.bankaccountname || companyInfo?.bank?.account_name || "KAILTECH TEST AND RESEARCH CENTRE PVT LTD."}</div>
                                    <div>Bank Name : {data.bankname || companyInfo?.bank?.bank_name || ""}, Branch Name : {data.bankbranch || companyInfo?.bank?.branch || ""}</div>
                                    <div>Bank Account No. : {data.bankaccountno || companyInfo?.bank?.account_no || ""}, A/c Type : {data.bankactype || companyInfo?.bank?.account_type || ""}</div>
                                    <div>IFSC CODE: {data.bankifsccode || companyInfo?.bank?.ifsc || ""}, MICR CODE: {data.bankmicr || companyInfo?.bank?.micr || ""}</div>
                                    <div style={{ marginTop: 6, fontSize: 11 }}>
                                        Certified that the particulars given above are true and correct.<br />
                                    </div>
                                </td>
                                <td style={{ ...s.td, verticalAlign: "top" }} colSpan={1}>
                                    <div style={{ minHeight: 120, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                                        <div style={{ textAlign: "right", marginBottom: 10, whiteSpace: "nowrap", textTransform: "uppercase", fontSize: 12 }}>
                                            For {data.companyname || companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."}
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right", marginTop: 10 }}>
                                            {(status === 1 || status === 2) && (data.digital_sign || data.signature_image) && (
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginBottom: 4 }}>
                                                    {data.signature_image && (
                                                        <img src={data.signature_image} alt="Signature" style={{ maxWidth: 150, maxHeight: 60, objectFit: "contain" }} />
                                                    )}
                                                    {data.digital_sign && (
                                                        <img src={data.digital_sign} alt="Digital Sign" style={{ maxWidth: 250, maxHeight: 100, objectFit: "contain" }} />
                                                    )}
                                                </div>
                                            )}
                                            <div style={{ fontWeight: "bold" }}>
                                                <u>Authorised Signatory</u>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ fontSize: 10, padding: "10px" }}>
                                    <strong><u>Terms &amp; Conditions:</u></strong>
                                    <ol style={{ paddingLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
                                        <li>Cross Cheque/DD should be drawn in favour of {data.companyname || companyInfo?.company?.name || "Kailtech Test And Research Centre Pvt. Ltd."} Payable at Indore</li>
                                        <li>Please attached bill details indicating Invoice No. Quotation no &amp; TDS deductions if any along with your payment.</li>
                                        <li>As per existing GST rules. the GSTR-1 has to be filed in the immediate next month of billing. So if you have any issue in this tax invoice viz customer Name, Address, GST No., Amount etc, please inform positively in writing before 5th of next month, otherwise no such request will be entertained.</li>
                                        <li>Payment not made with in 15 days from the date of issued bill will attract interest @ 24% P.A.</li>
                                        <li>If the payment is to be paid in Cash pay to UPI <strong>0795933A0099960.bqr@kotak</strong> only and take official receipt. Else claim of payment, shall not be accepted</li>
                                        <li>Subject to exclusive jurisdiction of courts at Indore only.</li>
                                        <li>Errors &amp; omissions accepted.</li>
                                    </ol>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                </div>{/* end flex:1 */}
                <FooterSection />
            </div>{/* end page 2 wrapper */}
        </div>
    );
}