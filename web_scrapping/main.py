from booking.booking import Booking

with Booking() as bot:
    bot.land_first_page()
    bot.select_place_to_go('Hồ Chí Minh')
    bot.select_dates('2025-06-15', '2025-06-16')
    bot.go_to_page(1)
    
    final_df = bot.scrape_all_pages(max_pages=21)
    final_df.to_csv('output.csv', index=False)
