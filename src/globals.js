//Adress of the slave used for SSP Communication;
//global.slave_adress = '00';
global.slave_adress = '10';
global.smart_hopper_address = '10';
//comands to send on Communication
global.trash = [0X01, 0XAF];
global.fail_test = [0X01, 0X06]; //fail test
global.synch = [0X01, 0X11];
global.reset = [0X01, 0X01];
global.host_protocol_version = [0X02, 0X06, 0X08];
global.poll = [0X01, 0X07];
global.get_serial_number = [0X01, 0X0C];
global.desable = [0X01, 0X09];
global.enable = [0X01, 0X0A];
global.get_firmware_version = [0X01, 0X20];
global.get_dataset_version = [0X01, 0X21];
global.set_inhivits = [0X03, 0X02, 0XFF, 0XFF];
global.display_on = [0X01, 0X03];
global.display_off = [0X01, 0X04];
global.setup_request = [0X01, 0X05];
global.reject = [0X01, 0X08];
global.uint_data = [0X01, 0X0D];
global.channel_value_data = [0X01, 0X0E];
global.channel_security_data = [0X01, 0X0F];
global.last_reject_code = [0X01, 0X17];
global.hold = [0X01, 0X18];
global.get_barcode_reader_configuration = [0X01, 0X23];
global.set_barcode_reader_configuration = [0X01, 0X24];
global.get_barcode_inhibit = [0X01, 0X25];
global.set_barcode_inhibit = [0X01, 0X26];
global.get_barcode_data = [0X01, 0X27];
//Set color of besel on start up
global.configure_bezel = [0X05, 0X54, 0X00, 0X00, 0XFF, 0X00];
global.poll_with_ack = [0X01, 0X56];
global.event_ack = [0X01, 0X57];
global.set_denomination_route = [0X01, 0X3B];
global.get_denomination_route = [0X01, 0X3C];
global.payout_amount = [0X01, 0X33];
global.set_denomination_level = [0X01, 0X34];
global.get_denomination_level = [0X01, 0X35];
global.halt_payout = [0X01, 0X38];
global.float_amount = [0X01, 0X3D];
global.get_min_payout = [0X01, 0X3E];
global.set_coin_mech_inhibits = [0X01, 0X40];
global.payout_by_denomination = [0X01, 0X46];
global.float_by_denomination = [0X01, 0X46];
global.empty_all = [0X01, 0X3F];
global.set_options = [0X01, 0X50];
global.get_options = [0X01, 0X51];
global.coin_mech_global_inhibit = [0X01, 0X49];
global.smart_empty = [0X01, 0X52];
global.cashbox_payout_operation_data = [0X01, 0X53];
global.get_all_levels = [0X01, 0X22];
global.get_counters = [0X01, 0X58];
global.reset_counters = [0X01, 0X59];
global.set_refill_mode = [0X01, 0X30];
global.get_note_positions = [0X01, 0X41];
global.payout_note = [0X01, 0X42];
global.stack_node = [0X01, 0X43];
global.set_value_report = [0X01, 0X45];
global.get_generator = [0X01, 0X4A];
global.coin_mech_options = [0X01, 0X5A];
global.get_build_revision = [0X01, 0X4f];
global.enable_payout_device = [0X01, 0X5C];
global.disable_payout_device = [0X01, 0X5B];
global.comms_pass_through = [0X01, 0X37];
global.set_baud_rate = [0X01, 0X4D];
global.ssp_set_encryption_key = [0X01, 0X60];
global.ssp__encryption_reset_to_default = [0X01, 0X60];
global.get_real_time_clock_configuration = [0X01, 0X62];
global.set_real_time_clock_configuration = [0X01, 0X64];
global.get_real_time_clock = [0X01, 0X63];
global.set_cashbox_payout_limit = [0X01, 0X4E];
global.get_tebs_barcode = [0X01, 0X65];
global.enable_tito_events = [0X01, 0X72];
global.coin_stir = [0X01, 0X5D];
global.ticket_print = [0X01, 0X70];
global.printer_configuration = [0X01, 0X71];
global.get_tebs_log = [0X01, 0X66];

global.cashbox_unlock_enable = [0X01, 0X67];
global.cashbox_lock_enable = [0X01, 0X68];

global.reset_tebs_logs = [0X01, 0X69];
global.cancel_escrow_transaction = [0X01, 0X76];
global.commit_escrow_transaction = [0X01, 0X77];
global.read_escrow_value = [0X01, 0X78];
global.get_escrow_size = [0X01, 0X79];
global.set_escrow_size = [0X01, 0X7A];
global.payout_amount_by_denomination = [0X01, 0X39];
global.coin_escrow = [0X01, 0X3A];
global.slave_reset = [0X01, 0XF1];

//for channel_1 - 10soles  [3B][00][0A 00 00 00 ][50 45 4E] al cashbag PEN
global.send_10_soles_a_cashbag = [0x09, 0X3B, 0X01, 0XE8, 0X03, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.send_10_soles_a_payout =  [0x09, 0X3B, 0X00, 0XE8, 0X03, 0X00, 0X00, 0X50, 0X45, 0X4E];
//for channel_2 - 20soles  [3B][01][14 00 00 00 ][50 45 4E] al payout  PEN
global.send_20_soles_a_cashbag = [0x09, 0X3B, 0X01, 0XD0, 0X07, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.send_20_soles_a_payout =  [0x09, 0X3B, 0X00, 0XD0, 0X07, 0X00, 0X00, 0X50, 0X45, 0X4E];
//for channel_3 - 50soles  [3B][01][32 00 00 00 ][50 45 4E] al payout  PEN
global.send_50_soles_a_cashbag = [0x09, 0X3B, 0X01, 0X88, 0X13, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.send_50_soles_a_payout =  [0x09, 0X3B, 0X00, 0X88, 0X13, 0X00, 0X00, 0X50, 0X45, 0X4E];
//for channel_4 - 100soles [3B][00][64 00 00 00 ][50 45 4E] al cashbag PEN
global.send_100_soles_a_cashbag = [0x09, 0X3B, 0X01, 0X10, 0X27, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.send_100_soles_a_payout =  [0x09, 0X3B, 0X00, 0X10, 0X27, 0X00, 0X00, 0X50, 0X45, 0X4E];
//for channel_5 - 200soles [3B][00][C8 00 00 00 ][50 45 4E] al cashbag PEN
global.send_200_soles_a_cashbag = [0x09, 0X3B, 0X01, 0X20, 0X4E, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.send_200_soles_a_payout =  [0x09, 0X3B, 0X00, 0X20, 0X4E, 0X00, 0X00, 0X50, 0X45, 0X4E];
global.enable_payout= [0x02, 0x5C, 0x01];
global.desable_payout= [0x01, 0x5B];

//pay 10 soles
//global.pay_amount= [0x09, 0x33, 0xE8, 0x03, 0x00, 0x00, 0x50, 0x45, 0x4E, 0x58];
//pay 20 soles
global.pay_amount= [0x09, 0x33, 0xD0, 0x07, 0x00, 0x00, 0x50, 0x45, 0x4E, 0x58];
//global.pay_amount="0933D007000050454E58";
//pay 50 soles
//global.pay_amount= [0x09, 0x33, 0x88, 0x13, 0x00, 0x00, 0x50, 0x45, 0x4E, 0x58];
//pay 100 soles
//global.pay_amount= [0x09, 0x33, 0x10, 0x27, 0x00, 0x00, 0x50, 0x45, 0x4E, 0x58];
//pay 200 soles
//global.pay_amount= [0x09, 0x33, 0x20, 0x4E, 0x00, 0x00, 0x50, 0x45, 0x4E, 0x58];
///////////////////////////////////////////////////////////////////////
global.on_startup=false;
global.ready_for_pooling = true;
global.ready_for_sending = true;
global.view_log=true;
global.tbm_status=true;
/////////////////////////////////////////////////////////////////////////////////////
global.received_cleaned;
global.single_command;
global.sent_command;
global.received_reg = false;
global.received_command;
//////////////////// VARIABLES FOR ENCRYPTION ///////////////////////////////////////
global.encryptionStatus = false;
//to get pre shared key calculation
global.calc_generator = 0;
global.calc_modulus = 0;
global.my_HOST_RND = 0;
global.set_generator = 0; //this is populated by GET KEYS function.
global.set_modulus = 0; //this is populated by GET KEYS function.
global.request_key_exchange = 0;

global.ecount = "00000000";
global.numero_de_serie="4545405";
global.country_code;
global.tebs_barcode = "";

//cuando envia ordenes al tbm de heroku app publica
//global.tbm_adressx="https://tbm-cloud.herokuapp.com";
global.tbm_adressx="http://192.168.1.2:3000";
global.release_version="1.0";
global.machine_ip="192.168.1.3";
global.machine_port="3000";
global.machine_developer="EC-HOME AUTOMATION";
global.machine_support="fsoarez@hotmail.com";
global.is_head_online=true;