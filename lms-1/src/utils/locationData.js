/**
 * Fallback static location data for all Indian States and their major cities.
 * Used when the backend /api/locations/* endpoints are unavailable.
 */

export const INDIA_STATES = [
  { id: 1, name: 'Andhra Pradesh' },
  { id: 2, name: 'Arunachal Pradesh' },
  { id: 3, name: 'Assam' },
  { id: 4, name: 'Bihar' },
  { id: 5, name: 'Chhattisgarh' },
  { id: 6, name: 'Goa' },
  { id: 7, name: 'Gujarat' },
  { id: 8, name: 'Haryana' },
  { id: 9, name: 'Himachal Pradesh' },
  { id: 10, name: 'Jharkhand' },
  { id: 11, name: 'Karnataka' },
  { id: 12, name: 'Kerala' },
  { id: 13, name: 'Madhya Pradesh' },
  { id: 14, name: 'Maharashtra' },
  { id: 15, name: 'Manipur' },
  { id: 16, name: 'Meghalaya' },
  { id: 17, name: 'Mizoram' },
  { id: 18, name: 'Nagaland' },
  { id: 19, name: 'Odisha' },
  { id: 20, name: 'Punjab' },
  { id: 21, name: 'Rajasthan' },
  { id: 22, name: 'Sikkim' },
  { id: 23, name: 'Tamil Nadu' },
  { id: 24, name: 'Telangana' },
  { id: 25, name: 'Tripura' },
  { id: 26, name: 'Uttar Pradesh' },
  { id: 27, name: 'Uttarakhand' },
  { id: 28, name: 'West Bengal' },
  { id: 29, name: 'Delhi' },
  { id: 30, name: 'Jammu and Kashmir' },
  { id: 31, name: 'Ladakh' },
  { id: 32, name: 'Puducherry' },
  { id: 33, name: 'Chandigarh' },
  { id: 34, name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { id: 35, name: 'Lakshadweep' },
  { id: 36, name: 'Andaman and Nicobar Islands' },
];

export const INDIA_CITIES = {
  1: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur', 'Ongole', 'Eluru', 'Bhimavaram', 'Nandyal', 'Srikakulam'],
  2: ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Along', 'Bomdila'],
  3: ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'North Lakhimpur', 'Karimganj', 'Sivasagar'],
  4: ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Purnia', 'Saharsa', 'Sasaram', 'Hajipur', 'Chhapra'],
  5: ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari'],
  6: ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Calangute', 'Anjuna'],
  7: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Mehsana', 'Bharuch', 'Valsad', 'Amreli', 'Porbandar', 'Kutch (Bhuj)', 'Patan'],
  8: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Kurukshetra', 'Rewari'],
  9: ['Shimla', 'Dharamsala', 'Solan', 'Mandi', 'Baddi', 'Kullu', 'Palampur', 'Bilaspur', 'Hamirpur', 'Una', 'Nahan', 'Manali'],
  10: ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Chaibasa', 'Medininagar'],
  11: ['Bengaluru', 'Mysuru', 'Hubli', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davangere', 'Ballari', 'Vijayapura', 'Shimoga', 'Tumakuru', 'Bidar', 'Raichur', 'Hospet', 'Hassan', 'Udupi', 'Chikkamagaluru', 'Mandya'],
  12: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Malappuram', 'Kottayam', 'Kasaragod', 'Pathanamthitta', 'Munnar'],
  13: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Singrauli', 'Burhanpur', 'Khandwa', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Chhatarpur'],
  14: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Malegaon', 'Jalna', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani', 'Ichalkaranji', 'Jalgaon', 'Bhiwandi', 'Navi Mumbai', 'Thane', 'Vasai-Virar', 'Kalyan-Dombivli', 'Mira-Bhayandar', 'Ulhasnagar', 'Panvel', 'Ratnagiri', 'Satara', 'Osmanabad', 'Beed', 'Hingoli', 'Wardha', 'Yavatmal', 'Buldhana', 'Washim', 'Gadchiroli', 'Gondia', 'Bhandara', 'Nandurbar', 'Palghar', 'Raigad', 'Shirdi', 'Lonavala', 'Mahabaleshwar', 'Alibaug', 'Baramati', 'Wai', 'Karad', 'Miraj', 'Sindhudurg'],
  15: ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul'],
  16: ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Baghmara', 'Resubelpara'],
  17: ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Mamit'],
  18: ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto'],
  19: ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda', 'Bargarh', 'Kendujhar', 'Koraput', 'Rayagada'],
  20: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Firozpur'],
  21: ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sri Ganganagar', 'Sikar', 'Pali', 'Barmer', 'Hanumangarh', 'Tonk', 'Baran', 'Bundi', 'Chittorgarh', 'Sawai Madhopur'],
  22: ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo'],
  23: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Hosur', 'Nagercoil', 'Kancheepuram', 'Kumbakonam', 'Cuddalore', 'Tiruvannamalai', 'Pollachi'],
  24: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Secunderabad', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Sangareddy', 'Siddipet', 'Mancherial'],
  25: ['Agartala', 'Udaipur', 'Dharmanagar', 'Sabroom', 'Kailasahar', 'Ambassa'],
  26: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Prayagraj', 'Meerut', 'Ghaziabad', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Faizabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Firozabad', 'Rampur', 'Shahjahanpur', 'Lakhimpur Kheri', 'Bulandshahr', 'Raebareli', 'Etawah', 'Mirzapur', 'Sitapur', 'Bahraich', 'Unnao', 'Hardoi'],
  27: ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Pithoragarh', 'Almora', 'Nainital', 'Mussoorie', 'Kotdwar'],
  28: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Haldia', 'Raiganj', 'Krishnanagar', 'Cooch Behar', 'Jalpaiguri', 'Darjeeling'],
  29: ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Lajpat Nagar', 'Karol Bagh', 'Connaught Place', 'Shahdara', 'Saket', 'Narela'],
  30: ['Srinagar', 'Jammu', 'Baramulla', 'Anantnag', 'Sopore', 'Punch', 'Rajouri', 'Kathua', 'Udhampur', 'Pahalgam', 'Gulmarg'],
  31: ['Leh', 'Kargil', 'Nubra', 'Zanskar'],
  32: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Ozhukarai'],
  33: ['Chandigarh', 'Manimajra', 'Panchkula', 'Mohali'],
  34: ['Silvassa', 'Daman', 'Diu', 'Amli'],
  35: ['Kavaratti', 'Agatti', 'Minicoy'],
  36: ['Port Blair', 'Car Nicobar', 'Rangat', 'Diglipur', 'Havelock Island'],
};

/**
 * Get cities as array of objects { id, name, state_id } for a given state id.
 * Falls back to static data if not available from API.
 */
export const getStaticCities = (stateId) => {
  const cities = INDIA_CITIES[stateId] || [];
  return cities.map((name, idx) => ({ id: idx + 1, name, state_id: stateId, is_active: true }));
};
