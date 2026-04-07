-- ============================================================
-- COMPREHENSIVE SEED: All Indian States + All Major Cities
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create tables if not already existing
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INTEGER REFERENCES states(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clear and re-seed
TRUNCATE cities RESTART IDENTITY CASCADE;
TRUNCATE states RESTART IDENTITY CASCADE;

-- 3. Insert all Indian States & UTs
INSERT INTO states (name, code) VALUES
('Andhra Pradesh', 'AP'),
('Arunachal Pradesh', 'AR'),
('Assam', 'AS'),
('Bihar', 'BR'),
('Chhattisgarh', 'CG'),
('Goa', 'GA'),
('Gujarat', 'GJ'),
('Haryana', 'HR'),
('Himachal Pradesh', 'HP'),
('Jharkhand', 'JH'),
('Karnataka', 'KA'),
('Kerala', 'KL'),
('Madhya Pradesh', 'MP'),
('Maharashtra', 'MH'),
('Manipur', 'MN'),
('Meghalaya', 'ML'),
('Mizoram', 'MZ'),
('Nagaland', 'NL'),
('Odisha', 'OD'),
('Punjab', 'PB'),
('Rajasthan', 'RJ'),
('Sikkim', 'SK'),
('Tamil Nadu', 'TN'),
('Telangana', 'TS'),
('Tripura', 'TR'),
('Uttar Pradesh', 'UP'),
('Uttarakhand', 'UK'),
('West Bengal', 'WB'),
('Delhi', 'DL'),
('Jammu and Kashmir', 'JK'),
('Ladakh', 'LA'),
('Puducherry', 'PY'),
('Chandigarh', 'CH'),
('Dadra and Nagar Haveli and Daman and Diu', 'DN'),
('Lakshadweep', 'LD'),
('Andaman and Nicobar Islands', 'AN');

-- 4. Insert cities for every state
DO $$
DECLARE
    ap_id INT; ar_id INT; as_id INT; br_id INT; cg_id INT;
    ga_id INT; gj_id INT; hr_id INT; hp_id INT; jh_id INT;
    ka_id INT; kl_id INT; mp_id INT; mh_id INT; mn_id INT;
    ml_id INT; mz_id INT; nl_id INT; od_id INT; pb_id INT;
    rj_id INT; sk_id INT; tn_id INT; ts_id INT; tr_id INT;
    up_id INT; uk_id INT; wb_id INT; dl_id INT; jk_id INT;
    la_id INT; py_id INT; ch_id INT; dn_id INT; ld_id INT; an_id INT;
BEGIN
    SELECT id INTO ap_id FROM states WHERE code='AP';
    SELECT id INTO ar_id FROM states WHERE code='AR';
    SELECT id INTO as_id FROM states WHERE code='AS';
    SELECT id INTO br_id FROM states WHERE code='BR';
    SELECT id INTO cg_id FROM states WHERE code='CG';
    SELECT id INTO ga_id FROM states WHERE code='GA';
    SELECT id INTO gj_id FROM states WHERE code='GJ';
    SELECT id INTO hr_id FROM states WHERE code='HR';
    SELECT id INTO hp_id FROM states WHERE code='HP';
    SELECT id INTO jh_id FROM states WHERE code='JH';
    SELECT id INTO ka_id FROM states WHERE code='KA';
    SELECT id INTO kl_id FROM states WHERE code='KL';
    SELECT id INTO mp_id FROM states WHERE code='MP';
    SELECT id INTO mh_id FROM states WHERE code='MH';
    SELECT id INTO mn_id FROM states WHERE code='MN';
    SELECT id INTO ml_id FROM states WHERE code='ML';
    SELECT id INTO mz_id FROM states WHERE code='MZ';
    SELECT id INTO nl_id FROM states WHERE code='NL';
    SELECT id INTO od_id FROM states WHERE code='OD';
    SELECT id INTO pb_id FROM states WHERE code='PB';
    SELECT id INTO rj_id FROM states WHERE code='RJ';
    SELECT id INTO sk_id FROM states WHERE code='SK';
    SELECT id INTO tn_id FROM states WHERE code='TN';
    SELECT id INTO ts_id FROM states WHERE code='TS';
    SELECT id INTO tr_id FROM states WHERE code='TR';
    SELECT id INTO up_id FROM states WHERE code='UP';
    SELECT id INTO uk_id FROM states WHERE code='UK';
    SELECT id INTO wb_id FROM states WHERE code='WB';
    SELECT id INTO dl_id FROM states WHERE code='DL';
    SELECT id INTO jk_id FROM states WHERE code='JK';
    SELECT id INTO la_id FROM states WHERE code='LA';
    SELECT id INTO py_id FROM states WHERE code='PY';
    SELECT id INTO ch_id FROM states WHERE code='CH';
    SELECT id INTO dn_id FROM states WHERE code='DN';
    SELECT id INTO ld_id FROM states WHERE code='LD';
    SELECT id INTO an_id FROM states WHERE code='AN';

    -- Andhra Pradesh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Visakhapatnam', ap_id, true), ('Vijayawada', ap_id, true), ('Guntur', ap_id, true),
    ('Nellore', ap_id, true), ('Kurnool', ap_id, true), ('Tirupati', ap_id, true),
    ('Rajahmundry', ap_id, true), ('Kakinada', ap_id, true), ('Kadapa', ap_id, true),
    ('Anantapur', ap_id, true), ('Ongole', ap_id, true), ('Eluru', ap_id, true),
    ('Bhimavaram', ap_id, true), ('Nandyal', ap_id, true), ('Srikakulam', ap_id, true);

    -- Arunachal Pradesh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Itanagar', ar_id, true), ('Naharlagun', ar_id, true), ('Pasighat', ar_id, true),
    ('Tawang', ar_id, true), ('Ziro', ar_id, true), ('Along', ar_id, true), ('Bomdila', ar_id, true);

    -- Assam
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Guwahati', as_id, true), ('Silchar', as_id, true), ('Dibrugarh', as_id, true),
    ('Jorhat', as_id, true), ('Nagaon', as_id, true), ('Tinsukia', as_id, true),
    ('Tezpur', as_id, true), ('Bongaigaon', as_id, true), ('Dhubri', as_id, true),
    ('North Lakhimpur', as_id, true), ('Karimganj', as_id, true), ('Sivasagar', as_id, true);

    -- Bihar
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Patna', br_id, true), ('Gaya', br_id, true), ('Bhagalpur', br_id, true),
    ('Muzaffarpur', br_id, true), ('Darbhanga', br_id, true), ('Bihar Sharif', br_id, true),
    ('Arrah', br_id, true), ('Begusarai', br_id, true), ('Katihar', br_id, true),
    ('Munger', br_id, true), ('Purnia', br_id, true), ('Saharsa', br_id, true),
    ('Sasaram', br_id, true), ('Hajipur', br_id, true), ('Chhapra', br_id, true);

    -- Chhattisgarh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Raipur', cg_id, true), ('Bhilai', cg_id, true), ('Bilaspur', cg_id, true),
    ('Korba', cg_id, true), ('Durg', cg_id, true), ('Rajnandgaon', cg_id, true),
    ('Jagdalpur', cg_id, true), ('Raigarh', cg_id, true), ('Ambikapur', cg_id, true),
    ('Dhamtari', cg_id, true), ('Kawardha', cg_id, true);

    -- Goa
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Panaji', ga_id, true), ('Margao', ga_id, true), ('Vasco da Gama', ga_id, true),
    ('Mapusa', ga_id, true), ('Ponda', ga_id, true), ('Bicholim', ga_id, true),
    ('Curchorem', ga_id, true), ('Calangute', ga_id, true), ('Anjuna', ga_id, true);

    -- Gujarat
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Ahmedabad', gj_id, true), ('Surat', gj_id, true), ('Vadodara', gj_id, true),
    ('Rajkot', gj_id, true), ('Bhavnagar', gj_id, true), ('Jamnagar', gj_id, true),
    ('Junagadh', gj_id, true), ('Gandhinagar', gj_id, true), ('Anand', gj_id, true),
    ('Navsari', gj_id, true), ('Morbi', gj_id, true), ('Nadiad', gj_id, true),
    ('Mehsana', gj_id, true), ('Bharuch', gj_id, true), ('Valsad', gj_id, true),
    ('Amreli', gj_id, true), ('Botad', gj_id, true), ('Porbandar', gj_id, true),
    ('Kutch (Bhuj)', gj_id, true), ('Patan', gj_id, true);

    -- Haryana
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Gurugram', hr_id, true), ('Faridabad', hr_id, true), ('Panipat', hr_id, true),
    ('Ambala', hr_id, true), ('Yamunanagar', hr_id, true), ('Rohtak', hr_id, true),
    ('Hisar', hr_id, true), ('Karnal', hr_id, true), ('Sonipat', hr_id, true),
    ('Panchkula', hr_id, true), ('Bhiwani', hr_id, true), ('Sirsa', hr_id, true),
    ('Bahadurgarh', hr_id, true), ('Kurukshetra', hr_id, true), ('Rewari', hr_id, true);

    -- Himachal Pradesh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Shimla', hp_id, true), ('Dharamsala', hp_id, true), ('Solan', hp_id, true),
    ('Mandi', hp_id, true), ('Baddi', hp_id, true), ('Kullu', hp_id, true),
    ('Palampur', hp_id, true), ('Bilaspur', hp_id, true), ('Hamirpur', hp_id, true),
    ('Una', hp_id, true), ('Nahan', hp_id, true), ('Manali', hp_id, true);

    -- Jharkhand
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Ranchi', jh_id, true), ('Jamshedpur', jh_id, true), ('Dhanbad', jh_id, true),
    ('Bokaro', jh_id, true), ('Deoghar', jh_id, true), ('Phusro', jh_id, true),
    ('Hazaribagh', jh_id, true), ('Giridih', jh_id, true), ('Ramgarh', jh_id, true),
    ('Medininagar', jh_id, true), ('Chirkunda', jh_id, true), ('Chaibasa', jh_id, true);

    -- Karnataka
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Bengaluru', ka_id, true), ('Mysuru', ka_id, true), ('Hubli', ka_id, true),
    ('Mangaluru', ka_id, true), ('Belagavi', ka_id, true), ('Kalaburagi', ka_id, true),
    ('Davangere', ka_id, true), ('Ballari', ka_id, true), ('Vijayapura', ka_id, true),
    ('Shimoga', ka_id, true), ('Tumakuru', ka_id, true), ('Bidar', ka_id, true),
    ('Raichur', ka_id, true), ('Hospet', ka_id, true), ('Hassan', ka_id, true),
    ('Udupi', ka_id, true), ('Chikkamagaluru', ka_id, true), ('Mandya', ka_id, true);

    -- Kerala
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Thiruvananthapuram', kl_id, true), ('Kochi', kl_id, true), ('Kozhikode', kl_id, true),
    ('Thrissur', kl_id, true), ('Kollam', kl_id, true), ('Palakkad', kl_id, true),
    ('Alappuzha', kl_id, true), ('Kannur', kl_id, true), ('Malappuram', kl_id, true),
    ('Kottayam', kl_id, true), ('Idukki', kl_id, true), ('Kasaragod', kl_id, true),
    ('Pathanamthitta', kl_id, true), ('Munnar', kl_id, true), ('Trissur', kl_id, true);

    -- Madhya Pradesh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Bhopal', mp_id, true), ('Indore', mp_id, true), ('Jabalpur', mp_id, true),
    ('Gwalior', mp_id, true), ('Ujjain', mp_id, true), ('Sagar', mp_id, true),
    ('Dewas', mp_id, true), ('Satna', mp_id, true), ('Ratlam', mp_id, true),
    ('Rewa', mp_id, true), ('Murwara', mp_id, true), ('Singrauli', mp_id, true),
    ('Burhanpur', mp_id, true), ('Khandwa', mp_id, true), ('Bhind', mp_id, true),
    ('Chhindwara', mp_id, true), ('Guna', mp_id, true), ('Shivpuri', mp_id, true),
    ('Vidisha', mp_id, true), ('Chhatarpur', mp_id, true);

    -- Maharashtra
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Mumbai', mh_id, true), ('Pune', mh_id, true), ('Nagpur', mh_id, true),
    ('Nashik', mh_id, true), ('Aurangabad', mh_id, true), ('Solapur', mh_id, true),
    ('Kolhapur', mh_id, true), ('Amravati', mh_id, true), ('Nanded', mh_id, true),
    ('Sangli', mh_id, true), ('Malegaon', mh_id, true), ('Jalna', mh_id, true),
    ('Akola', mh_id, true), ('Latur', mh_id, true), ('Dhule', mh_id, true),
    ('Ahmednagar', mh_id, true), ('Chandrapur', mh_id, true), ('Parbhani', mh_id, true),
    ('Ichalkaranji', mh_id, true), ('Jalgaon', mh_id, true), ('Bhiwandi', mh_id, true),
    ('Navi Mumbai', mh_id, true), ('Thane', mh_id, true), ('Vasai-Virar', mh_id, true),
    ('Kalyan-Dombivli', mh_id, true), ('Mira-Bhayandar', mh_id, true),
    ('Ulhasnagar', mh_id, true), ('Panvel', mh_id, true), ('Ratnagiri', mh_id, true),
    ('Satara', mh_id, true), ('Osmanabad', mh_id, true), ('Beed', mh_id, true),
    ('Hingoli', mh_id, true), ('Wardha', mh_id, true), ('Yavatmal', mh_id, true),
    ('Buldhana', mh_id, true), ('Washim', mh_id, true), ('Gadchiroli', mh_id, true),
    ('Gondia', mh_id, true), ('Bhandara', mh_id, true), ('Nandurbar', mh_id, true),
    ('Palghar', mh_id, true), ('Raigad', mh_id, true), ('Shirdi', mh_id, true),
    ('Lonavala', mh_id, true), ('Mahabaleshwar', mh_id, true), ('Alibaug', mh_id, true),
    ('Baramati', mh_id, true), ('Sindhudurg', mh_id, true), ('Wai', mh_id, true),
    ('Karad', mh_id, true), ('Miraj', mh_id, true), ('Osmanabad', mh_id, true);

    -- Manipur
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Imphal', mn_id, true), ('Thoubal', mn_id, true), ('Bishnupur', mn_id, true),
    ('Churachandpur', mn_id, true), ('Kakching', mn_id, true), ('Ukhrul', mn_id, true);

    -- Meghalaya
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Shillong', ml_id, true), ('Tura', ml_id, true), ('Jowai', ml_id, true),
    ('Nongstoin', ml_id, true), ('Baghmara', ml_id, true), ('Resubelpara', ml_id, true);

    -- Mizoram
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Aizawl', mz_id, true), ('Lunglei', mz_id, true), ('Champhai', mz_id, true),
    ('Serchhip', mz_id, true), ('Kolasib', mz_id, true), ('Mamit', mz_id, true);

    -- Nagaland
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Kohima', nl_id, true), ('Dimapur', nl_id, true), ('Mokokchung', nl_id, true),
    ('Tuensang', nl_id, true), ('Wokha', nl_id, true), ('Zunheboto', nl_id, true);

    -- Odisha
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Bhubaneswar', od_id, true), ('Cuttack', od_id, true), ('Rourkela', od_id, true),
    ('Brahmapur', od_id, true), ('Sambalpur', od_id, true), ('Puri', od_id, true),
    ('Balasore', od_id, true), ('Bhadrak', od_id, true), ('Baripada', od_id, true),
    ('Jharsuguda', od_id, true), ('Bargarh', od_id, true), ('Kendujhar', od_id, true),
    ('Koraput', od_id, true), ('Rayagada', od_id, true);

    -- Punjab
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Ludhiana', pb_id, true), ('Amritsar', pb_id, true), ('Jalandhar', pb_id, true),
    ('Patiala', pb_id, true), ('Bathinda', pb_id, true), ('Mohali', pb_id, true),
    ('Hoshiarpur', pb_id, true), ('Batala', pb_id, true), ('Pathankot', pb_id, true),
    ('Moga', pb_id, true), ('Abohar', pb_id, true), ('Malerkotla', pb_id, true),
    ('Khanna', pb_id, true), ('Phagwara', pb_id, true), ('Muktsar', pb_id, true),
    ('Barnala', pb_id, true), ('Rajpura', pb_id, true), ('Firozpur', pb_id, true);

    -- Rajasthan
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Jaipur', rj_id, true), ('Jodhpur', rj_id, true), ('Kota', rj_id, true),
    ('Bikaner', rj_id, true), ('Ajmer', rj_id, true), ('Udaipur', rj_id, true),
    ('Bhilwara', rj_id, true), ('Alwar', rj_id, true), ('Bharatpur', rj_id, true),
    ('Sri Ganganagar', rj_id, true), ('Sikar', rj_id, true), ('Pali', rj_id, true),
    ('Barmer', rj_id, true), ('Hanumangarh', rj_id, true), ('Dhaulpur', rj_id, true),
    ('Tonk', rj_id, true), ('Baran', rj_id, true), ('Bundi', rj_id, true),
    ('Chittorgarh', rj_id, true), ('Sawai Madhopur', rj_id, true);

    -- Sikkim
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Gangtok', sk_id, true), ('Namchi', sk_id, true), ('Gyalshing', sk_id, true),
    ('Mangan', sk_id, true), ('Rangpo', sk_id, true);

    -- Tamil Nadu
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Chennai', tn_id, true), ('Coimbatore', tn_id, true), ('Madurai', tn_id, true),
    ('Tiruchirappalli', tn_id, true), ('Salem', tn_id, true), ('Tirunelveli', tn_id, true),
    ('Tiruppur', tn_id, true), ('Erode', tn_id, true), ('Vellore', tn_id, true),
    ('Thoothukudi', tn_id, true), ('Dindigul', tn_id, true), ('Thanjavur', tn_id, true),
    ('Ranipet', tn_id, true), ('Sivakasi', tn_id, true), ('Karur', tn_id, true),
    ('Udhagamandalam', tn_id, true), ('Hosur', tn_id, true), ('Nagercoil', tn_id, true),
    ('Kancheepuram', tn_id, true), ('Kumbakonam', tn_id, true), ('Cuddalore', tn_id, true),
    ('Tiruvannamalai', tn_id, true), ('Pollachi', tn_id, true);

    -- Telangana
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Hyderabad', ts_id, true), ('Warangal', ts_id, true), ('Nizamabad', ts_id, true),
    ('Karimnagar', ts_id, true), ('Khammam', ts_id, true), ('Ramagundam', ts_id, true),
    ('Secunderabad', ts_id, true), ('Mahbubnagar', ts_id, true), ('Nalgonda', ts_id, true),
    ('Adilabad', ts_id, true), ('Suryapet', ts_id, true), ('Miryalaguda', ts_id, true),
    ('Sangareddy', ts_id, true), ('Siddipet', ts_id, true), ('Mancherial', ts_id, true);

    -- Tripura
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Agartala', tr_id, true), ('Udaipur', tr_id, true), ('Dharmanagar', tr_id, true),
    ('Sabroom', tr_id, true), ('Kailasahar', tr_id, true), ('Ambassa', tr_id, true);

    -- Uttar Pradesh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Lucknow', up_id, true), ('Kanpur', up_id, true), ('Agra', up_id, true),
    ('Varanasi', up_id, true), ('Prayagraj', up_id, true), ('Meerut', up_id, true),
    ('Ghaziabad', up_id, true), ('Noida', up_id, true), ('Bareilly', up_id, true),
    ('Aligarh', up_id, true), ('Moradabad', up_id, true), ('Saharanpur', up_id, true),
    ('Gorakhpur', up_id, true), ('Faizabad', up_id, true), ('Jhansi', up_id, true),
    ('Muzaffarnagar', up_id, true), ('Mathura', up_id, true), ('Firozabad', up_id, true),
    ('Rampur', up_id, true), ('Shahjahanpur', up_id, true), ('Lakhimpur Kheri', up_id, true),
    ('Budaun', up_id, true), ('Bulandshahr', up_id, true), ('Raebareli', up_id, true),
    ('Etawah', up_id, true), ('Mirzapur', up_id, true), ('Sitapur', up_id, true),
    ('Bahraich', up_id, true), ('Unnao', up_id, true), ('Hardoi', up_id, true);

    -- Uttarakhand
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Dehradun', uk_id, true), ('Haridwar', uk_id, true), ('Roorkee', uk_id, true),
    ('Haldwani', uk_id, true), ('Rudrapur', uk_id, true), ('Kashipur', uk_id, true),
    ('Rishikesh', uk_id, true), ('Pithoragarh', uk_id, true), ('Almora', uk_id, true),
    ('Nainital', uk_id, true), ('Mussoorie', uk_id, true), ('Kotdwar', uk_id, true);

    -- West Bengal
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Kolkata', wb_id, true), ('Howrah', wb_id, true), ('Durgapur', wb_id, true),
    ('Asansol', wb_id, true), ('Siliguri', wb_id, true), ('Bardhaman', wb_id, true),
    ('Malda', wb_id, true), ('Baharampur', wb_id, true), ('Habra', wb_id, true),
    ('Kharagpur', wb_id, true), ('Shantipur', wb_id, true), ('Dankuni', wb_id, true),
    ('Dhulian', wb_id, true), ('Ranaghat', wb_id, true), ('Haldia', wb_id, true),
    ('Raiganj', wb_id, true), ('Krishnanagar', wb_id, true), ('Cooch Behar', wb_id, true),
    ('Jalpaiguri', wb_id, true), ('Darjeeling', wb_id, true);

    -- Delhi
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('New Delhi', dl_id, true), ('Central Delhi', dl_id, true), ('North Delhi', dl_id, true),
    ('South Delhi', dl_id, true), ('East Delhi', dl_id, true), ('West Delhi', dl_id, true),
    ('Dwarka', dl_id, true), ('Rohini', dl_id, true), ('Janakpuri', dl_id, true),
    ('Lajpat Nagar', dl_id, true), ('Karol Bagh', dl_id, true), ('Connaught Place', dl_id, true),
    ('Shahdara', dl_id, true), ('Saket', dl_id, true), ('Narela', dl_id, true);

    -- Jammu and Kashmir
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Srinagar', jk_id, true), ('Jammu', jk_id, true), ('Baramulla', jk_id, true),
    ('Anantnag', jk_id, true), ('Sopore', jk_id, true), ('Punch', jk_id, true),
    ('Rajouri', jk_id, true), ('Kathua', jk_id, true), ('Udhampur', jk_id, true),
    ('Pahalgam', jk_id, true), ('Gulmarg', jk_id, true);

    -- Ladakh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Leh', la_id, true), ('Kargil', la_id, true), ('Nubra', la_id, true), ('Zanskar', la_id, true);

    -- Puducherry
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Puducherry', py_id, true), ('Karaikal', py_id, true), ('Mahe', py_id, true),
    ('Yanam', py_id, true), ('Ozhukarai', py_id, true);

    -- Chandigarh
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Chandigarh', ch_id, true), ('Manimajra', ch_id, true), ('Panchkula', ch_id, true),
    ('Mohali', ch_id, true);

    -- Dadra and Nagar Haveli
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Silvassa', dn_id, true), ('Daman', dn_id, true), ('Diu', dn_id, true),
    ('Amli', dn_id, true);

    -- Lakshadweep
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Kavaratti', ld_id, true), ('Agatti', ld_id, true), ('Minicoy', ld_id, true);

    -- Andaman and Nicobar
    INSERT INTO cities (name, state_id, is_active) VALUES
    ('Port Blair', an_id, true), ('Car Nicobar', an_id, true), ('Rangat', an_id, true),
    ('Diglipur', an_id, true), ('Havelock Island', an_id, true);

END $$;

-- Verify
SELECT s.name AS state, COUNT(c.id) AS city_count
FROM states s LEFT JOIN cities c ON s.id = c.state_id
GROUP BY s.name ORDER BY s.name;
