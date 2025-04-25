"use client";
import { clear } from "console";
import { useEffect, useState } from "react";

interface StationConfigEntry {
  stop: string;
  service_type: string;
  seq: string;
  eta?: {
    time: string;
    rmk: string;
  }[]
}

type StationConfig = Record<string, StationConfigEntry>;

interface ETAResponse {
  type: "ETA";
  version: string;
  generated_timestamp: string;
  data: ETAEntry[];
}

interface ETAEntry {
  co: string;
  route: string;
  dir: "O" | "I"; // O = Outbound, I = Inbound
  service_type: number;
  seq: number;
  dest_tc: string;
  dest_sc: string;
  dest_en: string;
  eta_seq: number;
  eta: string;
  rmk_tc: string;
  rmk_sc: string;
  rmk_en: string;
  data_timestamp: string;
}


const station_ag_config: StationConfig = {
  "39M": {
    "stop": "A6DCDE5BE439B179",
    "service_type": "1",
    "seq": "1",
  },
  "39A": {
    "stop": "33674BF8F361D2C3",
    "service_type": "1",
    "seq": "13",
  },
  "30": {
    "stop": "756141FB7A6EA349",
    "service_type": "1",
    "seq": "1",
  },
  "30X": {
    "stop": "17CDBCBA18D0D000",
    "service_type": "1",
    "seq": "1",
  },
}

const station_cpr_config: StationConfig = {
  "68M": {
    "stop": "A68A34F71D94FF13",
    "service_type": "1",
    "seq": "3",
  },
  "234X": {
    "stop": "9E970734315233A2",
    "service_type": "1",
    "seq": "3",
  }
}

export default function Home() {
  const [lastUpdated, setLastUpdated] = useState("");
  const [location, setLocation] = useState("荃威花園");
  const station_config: StationConfig = location === "荃威花園" ? station_ag_config : station_cpr_config;

  useEffect(() => {
    const fetchData = async () => {
      for (const [route, meta] of Object.entries(station_config)) {
        const { stop, service_type, seq } = meta;
        const url = `https://data.etabus.gov.hk/v1/transport/kmb/eta/${stop}/${route}/${service_type}`;
        const response = await fetch(url);
        if (response.ok) {
          const eta: ETAResponse = await response.json();
          const etaData: ETAEntry[] | undefined[] = eta.data.filter((entry) => entry.seq === parseInt(seq));
          station_config[route].eta = etaData.map((entry) => {
            const rmk_tc = entry.rmk_tc;
            const etaString = entry.eta;
            const eta = new Date(etaString);
            const now = new Date();

            const diffMs = eta.getTime() - now.getTime(); // difference in milliseconds
            const diffMinutes = Math.round(diffMs / 60000); // convert to minutes
            
            return {
              time: String(diffMinutes),
              rmk: rmk_tc,
            }
          });
        }
      }
      setLastUpdated(new Date().toLocaleString());
    }
    
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [location]);

  return (
    <div className="bg-gray-100 w-full flex justify-between items-center p-4">
      <div className="flex flex-col items-start">
        <span className="text-2xl font-bold">{location}</span>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          onClick={() => setLocation(location === "荃威花園" ? "青山公路" : "荃威花園")}
        >{location === "荃威花園"? "青山公路": "荃威花園"}</button>
        <span className="text-sm text-gray-500 mt-2">最後更新: {lastUpdated}</span>
      </div>
      <div className="flex flex-col items-start">
        {
          Object.keys(station_config).map((key) => {
            const { stop, service_type, seq } = station_config[key];
            return (
              <div key={key} className="flex justify-between items-center w-full p-4 border-b">
                <div className="p-4">
                  <span className="text-lg font-bold">{key}</span>
                </div>
                <div className="flex flex-col items-end">
                  {
                    station_config[key].eta?.map((entry, index) => {
                      return (
                        <div key={index} className="flex flex-end justify-between items-left">
                          <span>{entry.time} 分鐘</span>
                          <span>{entry.rmk}</span>
                        </div>
                      );
                    })
                  }
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
