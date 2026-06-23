export interface Tool {
  name: string;
  url: string;
  description: string;
}

export interface Category {
  name: string;
  tools: Tool[];
}

export const bookmarks: Category[] = [
  {
    name: "Threat Analysis (Multi-Indicator Active Scan)",
    tools: [
      { name: "VirusTotal", url: "https://virustotal.com", description: "Multi-engine file, URL & hash scanner" },
      { name: "Hybrid Analysis", url: "https://hybrid-analysis.com", description: "Free malware sandbox with behavioral report" },
      { name: "ANY.RUN", url: "https://app.any.run", description: "Interactive malware sandbox" },
      { name: "URLScan.io", url: "https://urlscan.io", description: "Scan & screenshot URLs, DOM analysis" },
    ]
  },
  {
    name: "External Attack Surface Intelligence (Infra / Exposure / Credentials)",
    tools: [
      { name: "Shodan", url: "https://shodan.io", description: "Internet-wide port & banner scanner" },
      { name: "Censys", url: "https://censys.io", description: "ASN, cert & host exposure search" },
      { name: "Hudson Rock", url: "https://www.hudsonrock.com/free-tools", description: "Compromised credentials lookup from infostealer infections" },
    ]
  },
  {
    name: "Threat Intelligence (Feeds / IOC / Context)",
    tools: [
      { name: "OTX AlienVault", url: "https://otx.alienvault.com", description: "Open threat exchange, IOC feeds" },
      { name: "IBM X-Force", url: "https://exchange.xforce.ibmcloud.com", description: "Threat intel, malware analysis & IOC lookup" },
    ]
  },
  {
    name: "Indicator Reputation (IP / URL / Hash / Phone / Mail)",
    tools: [
      { name: "AbuseIPDB", url: "https://abuseipdb.com", description: "IP abuse reports & reputation scoring" },
      { name: "IPQualityScore", url: "https://ipqualityscore.com", description: "IP, URL & email reputation scoring" },
      { name: "PhishTank", url: "https://phishtank.org", description: "Community phishing URL database" },
      { name: "MalwareBazaar", url: "https://bazaar.abuse.ch", description: "Malware sample repository by abuse.ch" },
    ]
  },
  {
    name: "Utilities",
    tools: [
      { name: "CyberChef", url: "https://gchq.github.io/CyberChef", description: "Data transformation & analysis swiss army knife" },
      { name: "IPInfo Bulk Lookup", url: "https://www.infobyip.com/ipbulklookup.php", description: "Bulk IP geolocation & info lookup" },
      { name: "Browserling", url: "https://www.browserling.com", description: "Live browser sandbox for safe URL browsing" },
    ]
  },
];
