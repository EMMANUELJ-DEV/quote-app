module random_quote_generator::RandomQuote {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_framework::block;
    use aptos_framework::account; 

    struct QuoteHolder has key {
        quotes: vector<string::String>,
        quote_added_events: event::EventHandle<QuoteAddedEvent>,
    }

    #[event]
    struct QuoteAddedEvent has drop, store {
        quote: string::String,
    }

    const EQUOTE_HOLDER_NOT_FOUND: u64 = 1;
    const EQUOTE_LIST_EMPTY: u64 = 2;

    public entry fun initialize(account: &signer) {
        let account_address = signer::address_of(account);
        if (!exists<QuoteHolder>(account_address)) {
            move_to(account, QuoteHolder {
                quotes: vector::empty(),
                quote_added_events: account::new_event_handle(account),
            });
        }
    }

    public entry fun add_quote(account: &signer, quote: string::String) acquires QuoteHolder {
        let account_address = signer::address_of(account);
        assert!(exists<QuoteHolder>(account_address), EQUOTE_HOLDER_NOT_FOUND);
        let quote_holder = borrow_global_mut<QuoteHolder>(account_address);
        vector::push_back(&mut quote_holder.quotes, quote);
        
        event::emit_event(&mut quote_holder.quote_added_events, QuoteAddedEvent { quote });
    }

    public fun get_random_quote(account: &signer): string::String acquires QuoteHolder {
        let account_address = signer::address_of(account);
        assert!(exists<QuoteHolder>(account_address), EQUOTE_HOLDER_NOT_FOUND);
        let quote_holder = borrow_global<QuoteHolder>(account_address);
        let quotes = &quote_holder.quotes;
        let length = vector::length(quotes);
        assert!(length > 0, EQUOTE_LIST_EMPTY);
        
        let current_timestamp = timestamp::now_microseconds();
        let block_height = block::get_current_block_height();
        let random_seed = current_timestamp + block_height;
        let random_index = (random_seed % (length as u64)) as u64;
        
        *vector::borrow(quotes, random_index)
    }
    public entry fun get_random_quotee(account: &signer) acquires QuoteHolder {
    let account_address = signer::address_of(account);
    assert!(exists<QuoteHolder>(account_address), EQUOTE_HOLDER_NOT_FOUND);
    
    let quote_holder = borrow_global_mut<QuoteHolder>(account_address);
    
    let quotes = &quote_holder.quotes;
    let length = vector::length(quotes);
    assert!(length > 0, EQUOTE_LIST_EMPTY);
    
    let current_timestamp = timestamp::now_microseconds();
    let block_height = block::get_current_block_height();
    let random_seed = current_timestamp + block_height;
    let random_index = (random_seed % (length as u64)) as u64;
    
    let random_quote = vector::borrow(quotes, random_index);
    
    event::emit_event(&mut quote_holder.quote_added_events, QuoteAddedEvent { quote: *random_quote });
}

}