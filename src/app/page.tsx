"use client";
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
  const [time, setTime] = useState(new Date());
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000); // update every second

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-100 w-full flex justify-between items-center p-4 min-h-screen">
      <p className="text-5xl font-mono text-black fixed top-10 left-5">
        {time.toLocaleTimeString()}
      </p>
      <div className="flex flex-col items-start">
        <span className="text-7xl font-bold text-black">{location}</span>
        <button
          className="bg-blue-500 text-white px-18 py-5 rounded mt-4 text-3xl"
          onClick={() => setLocation(location === "荃威花園" ? "青山公路" : "荃威花園")}
        >{location === "荃威花園"? "青山公路": "荃威花園"}</button>
        <span className="text-2xl text-gray-500 mt-2">最後更新: {lastUpdated}</span>
      </div>
      <div className="flex flex-col items-start">
        {
          Object.keys(station_config).map((key) => {
            return (
              <div key={key} className="flex justify-between items-center w-full p-4 border-b border-gray-500">
                <div className="p-4">
                  <span className="text-3xl font-bold text-3xl text-black">{key}</span>
                </div>
                <div className="flex flex-col items-end">
                  {
                    station_config[key].eta?.map((entry, index) => {
                      return (
                        <div key={index} className="flex flex-end justify-between items-left">
                          <span className="text-black text-2xl">{entry.time} 分鐘 </span>
                          <span className="text-gray-950 text-2xl ml-4">{entry.rmk}</span>
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
