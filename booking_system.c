#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#define MAX_SHOWS 5
#define ROWS 5
#define COLS 10
#define SHOWS_FILE "shows_data.bin"
#define BOOKINGS_FILE "bookings_data.bin"

typedef struct {
    int id;
    char title[50];
    float price;
    int seats[ROWS][COLS]; // 0 for available, 1 for booked
} Show;

typedef struct {
    char bookingID[10];
    char customerName[50];
    char showName[50];
    char seatNumbers[100];
    float totalAmount;
} Booking;

Show shows[MAX_SHOWS];

// Function Prototypes
void initShows();
void loadData();
void saveData();
void displayShows();
void showSeatLayout(int showIdx);
void bookTicket();
void viewReceipt();
void occupancyReport();
void generateBookingID(char* id);

int main() {
    loadData();
    int choice;

    while (1) {
        printf("\n--- MOVIE TICKET BOOKING SYSTEM (C) ---\n");
        printf("1. Display Shows\n");
        printf("2. Book Tickets\n");
        printf("3. View Receipt by ID\n");
        printf("4. Occupancy Report\n");
        printf("5. Exit\n");
        printf("Select an option: ");
        
        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Please enter a number.\n");
            while(getchar() != '\n'); // Clear buffer
            continue;
        }

        switch (choice) {
            case 1: displayShows(); break;
            case 2: bookTicket(); break;
            case 3: viewReceipt(); break;
            case 4: occupancyReport(); break;
            case 5: printf("Goodbye!\n"); return 0;
            default: printf("Invalid choice.\n");
        }
    }
    return 0;
}

void initShows() {
    char* names[] = {"Avengers: Endgame", "Inception", "Interstellar", "The Matrix", "Parasite"};
    float prices[] = {12.50, 10.00, 11.00, 9.50, 10.50};
    
    for (int i = 0; i < MAX_SHOWS; i++) {
        shows[i].id = i + 1;
        strcpy(shows[i].title, names[i]);
        shows[i].price = prices[i];
        for (int r = 0; r < ROWS; r++)
            for (int c = 0; c < COLS; c++)
                shows[i].seats[r][c] = 0;
    }
    saveData();
}

void loadData() {
    FILE *f = fopen(SHOWS_FILE, "rb");
    if (!f) {
        initShows();
        return;
    }
    fread(shows, sizeof(Show), MAX_SHOWS, f);
    fclose(f);
}

void saveData() {
    FILE *f = fopen(SHOWS_FILE, "wb");
    if (f) {
        fwrite(shows, sizeof(Show), MAX_SHOWS, f);
        fclose(f);
    }
}

void displayShows() {
    printf("\n%-4s | %-20s | %-10s\n", "ID", "Title", "Price");
    printf("------------------------------------------\n");
    for (int i = 0; i < MAX_SHOWS; i++) {
        printf("%-4d | %-20s | $%.2f\n", shows[i].id, shows[i].title, shows[i].price);
    }
}

void showSeatLayout(int idx) {
    printf("\nSeat Layout for %s:\n", shows[idx].title);
    printf("    ");
    for(int i=1; i<=COLS; i++) printf("%2d ", i);
    printf("\n");
    for (int r = 0; r < ROWS; r++) {
        printf("%c | ", 'A' + r);
        for (int c = 0; c < COLS; c++) {
            printf("%s ", shows[idx].seats[r][c] ? "[X]" : "[ ]");
        }
        printf("\n");
    }
    printf("[ ] = Available  [X] = Booked\n");
}

void generateBookingID(char* id) {
    const char charset[] = "0123456789ABCDEF";
    srand(time(NULL));
    for (int i = 0; i < 6; i++) {
        id[i] = charset[rand() % 16];
    }
    id[6] = '\0';
}

void bookTicket() {
    displayShows();
    int showID, numSeats;
    printf("\nEnter Show ID to book: ");
    scanf("%d", &showID);
    
    if (showID < 1 || showID > MAX_SHOWS) {
        printf("Invalid Show ID.\n");
        return;
    }
    
    int idx = showID - 1;
    showSeatLayout(idx);
    
    char name[50];
    printf("Enter Customer Name: ");
    scanf(" %[^\n]s", name);
    
    printf("How many seats? ");
    scanf("%d", &numSeats);
    
    Booking b;
    generateBookingID(b.bookingID);
    strcpy(b.customerName, name);
    strcpy(b.showName, shows[idx].title);
    b.seatNumbers[0] = '\0';
    b.totalAmount = numSeats * shows[idx].price;
    
    for (int i = 0; i < numSeats; i++) {
        char seatCode[5];
        printf("Enter seat code %d (e.g., A1): ", i + 1);
        scanf("%s", seatCode);
        
        int r = seatCode[0] - 'A';
        int c = atoi(&seatCode[1]) - 1;
        
        // Validation logic
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
            printf("Invalid seat code. Booking aborted.\n");
            return;
        }
        if (shows[idx].seats[r][c] == 1) {
            printf("Seat %s is already booked! Booking aborted.\n", seatCode);
            return;
        }
        
        shows[idx].seats[r][c] = 1;
        strcat(b.seatNumbers, seatCode);
        if (i < numSeats - 1) strcat(b.seatNumbers, ", ");
    }
    
    // Persistence: Append to bookings file
    FILE *f = fopen(BOOKINGS_FILE, "ab");
    if (f) {
        fwrite(&b, sizeof(Booking), 1, f);
        fclose(f);
        saveData(); // Save show state (booked seats)
        printf("\n--- Booking Successful! ---\n");
        printf("Booking ID: %s | Total: $%.2f\n", b.bookingID, b.totalAmount);
    }
}

void viewReceipt() {
    char id[10];
    printf("Enter Booking ID: ");
    scanf("%s", id);
    
    FILE *f = fopen(BOOKINGS_FILE, "rb");
    if (!f) {
        printf("No bookings found.\n");
        return;
    }
    
    Booking b;
    int found = 0;
    while (fread(&b, sizeof(Booking), 1, f)) {
        if (strcmp(b.bookingID, id) == 0) {
            printf("\n******************************\n");
            printf("RECEIPT: %s\n", b.bookingID);
            printf("Name:    %s\n", b.customerName);
            printf("Show:    %s\n", b.showName);
            printf("Seats:   %s\n", b.seatNumbers);
            printf("Total:   $%.2f\n", b.totalAmount);
            printf("******************************\n");
            found = 1;
            break;
        }
    }
    if (!found) printf("Booking ID not found.\n");
    fclose(f);
}

void occupancyReport() {
    printf("\n--- Occupancy Report ---\n");
    printf("%-20s | %-5s | %-6s | %-5s | %-s\n", "Show Title", "Total", "Booked", "Avail", "Occupancy %");
    printf("-------------------------------------------------------------\n");
    
    for (int i = 0; i < MAX_SHOWS; i++) {
        int total = ROWS * COLS;
        int booked = 0;
        for (int r = 0; r < ROWS; r++)
            for (int c = 0; c < COLS; c++)
                if (shows[i].seats[r][c]) booked++;
        
        int avail = total - booked;
        float perc = ((float)booked / total) * 100;
        printf("%-20s | %-5d | %-6d | %-5d | %.1f%%\n", shows[i].title, total, booked, avail, perc);
    }
}
