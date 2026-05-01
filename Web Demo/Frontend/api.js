const API_URL = "http://localhost:8000";

export async function fetchHotels() {
  const res = await fetch(`${API_URL}/hotels`);
  return await res.json();
}

export async function fetchPersonalizedHotels(yeuThich, khongThich, ngayDi, ngayVe, diaDiem) {
  const res = await fetch(`${API_URL}/personalized-hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ yeu_thich: yeuThich, khong_thich: khongThich, ngay_di: ngayDi, ngay_ve: ngayVe, dia_diem: diaDiem }),
  });
  return await res.json();
}

export async function fetchOptimalHotels(payload) {
  const res = await fetch(`${API_URL}/optimal-hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}
